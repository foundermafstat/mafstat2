import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function GET(request: Request) {
  try {
    // Проверяем авторизацию и права администратора
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ error: 'Доступ запрещен. Требуются права администратора.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sql = neon(process.env.DATABASE_URL || '');

    // 1. Получаем список всех таблиц в базе данных
    const tablesResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    const tables = tablesResult.map((row: any) => row.table_name);

    // 2. Генерируем структуру таблиц (DDL)
    const structureQueries: Record<string, string> = {};
    const constraintQueries: Record<string, string[]> = {};

    for (const table of tables) {
      // Получаем DDL для создания таблицы
      const tableStructure = await sql`
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM
          information_schema.columns
        WHERE
          table_schema = 'public'
          AND table_name = ${table}
        ORDER BY
          ordinal_position;
      `;

      // Получаем информацию о первичных ключах
      const primaryKeys = await sql`
        SELECT
          kcu.column_name
        FROM
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        WHERE
          tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = ${table}
        ORDER BY
          kcu.ordinal_position;
      `;

      // Создаем DDL для таблицы
      let createTableSQL = `CREATE TABLE "${table}" (\n`;
      
      const columns = tableStructure.map((col: any) => {
        let columnDefinition = `  "${col.column_name}" ${col.data_type}`;
        
        // Добавляем длину для типов с максимальной длиной
        if (col.character_maximum_length) {
          columnDefinition += `(${col.character_maximum_length})`;
        }
        
        // Nullable
        if (col.is_nullable === 'NO') {
          columnDefinition += ' NOT NULL';
        }
        
        // Default value
        if (col.column_default !== null) {
          columnDefinition += ` DEFAULT ${col.column_default}`;
        }
        
        return columnDefinition;
      });

      // Добавляем первичный ключ, если он есть
      if (primaryKeys.length > 0) {
        const pkColumns = primaryKeys.map((pk: any) => `"${pk.column_name}"`).join(', ');
        columns.push(`  PRIMARY KEY (${pkColumns})`);
      }

      createTableSQL += columns.join(',\n');
      createTableSQL += '\n);';
      
      structureQueries[table] = createTableSQL;
      
      // Получаем внешние ключи
      const foreignKeys = await sql`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE
          tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = ${table};
      `;

      if (foreignKeys.length > 0) {
        constraintQueries[table] = foreignKeys.map((fk: any) => {
          return `ALTER TABLE "${table}" ADD CONSTRAINT "${fk.constraint_name}" FOREIGN KEY ("${fk.column_name}") REFERENCES "${fk.foreign_table_name}"("${fk.foreign_column_name}");`;
        });
      }
    }

    // 3. Получаем данные из всех таблиц (DML)
    const dataQueries: Record<string, string[]> = {};

    for (const table of tables) {
      try {
        // Получаем данные из таблицы - используем ручное построение запроса
        // так как имена таблиц нельзя передавать как параметры
        const query = `SELECT * FROM "${table}" LIMIT 1000`;
        const tableDataResult = await sql.query(query);
        
        if (tableDataResult && tableDataResult.length > 0) {
          // Получаем список колонок
          const columns = Object.keys(tableDataResult[0]);
          const columnsList = columns.map(col => `"${col}"`).join(', ');
          
          // Создаем INSERT запросы для данных
          dataQueries[table] = tableDataResult.map((row: any) => {
            const values = columns.map(col => {
              const value = row[col];
              if (value === null) return 'NULL';
              if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
              if (typeof value === 'object') {
                if (value instanceof Date) return `'${value.toISOString()}'`;
                return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
              }
              return value;
            }).join(', ');
            
            return `INSERT INTO "${table}" (${columnsList}) VALUES (${values});`;
          });
        }
      } catch (error) {
        console.error(`Ошибка при получении данных таблицы ${table}:`, error);
        // Продолжаем с следующей таблицей
      }
    }

    // 4. Собираем все в единый SQL-скрипт
    let backupSQL = `-- База данных: ${process.env.DATABASE_URL?.split('/').pop() || 'neon'}\n`;
    backupSQL += `-- Дата создания: ${new Date().toISOString()}\n\n`;
    
    // Добавляем комментарий для отключения ограничений
    backupSQL += `-- Отключаем ограничения внешних ключей на время импорта\n`;
    backupSQL += `SET session_replication_role = 'replica';\n\n`;
    
    // Структура таблиц
    backupSQL += `-- Структура базы данных\n\n`;
    for (const table of tables) {
      backupSQL += `-- Таблица: ${table}\n`;
      backupSQL += `DROP TABLE IF EXISTS "${table}" CASCADE;\n`;
      backupSQL += structureQueries[table] + '\n\n';
    }
    
    // Данные таблиц
    backupSQL += `-- Данные таблиц\n\n`;
    for (const table of tables) {
      if (dataQueries[table] && dataQueries[table].length > 0) {
        backupSQL += `-- Данные для таблицы: ${table}\n`;
        backupSQL += dataQueries[table].join('\n') + '\n\n';
      }
    }
    
    // Внешние ключи добавляем в конце
    backupSQL += `-- Внешние ключи\n\n`;
    for (const table of tables) {
      if (constraintQueries[table] && constraintQueries[table].length > 0) {
        backupSQL += `-- Внешние ключи для таблицы: ${table}\n`;
        backupSQL += constraintQueries[table].join('\n') + '\n\n';
      }
    }
    
    // Включаем обратно ограничения
    backupSQL += `-- Включаем ограничения внешних ключей\n`;
    backupSQL += `SET session_replication_role = 'origin';\n`;

    // 5. Создаем объект с SQL и метаинформацией
    const backupData = {
      sql: backupSQL,
      metadata: {
        timestamp: new Date().toISOString(),
        tables: tables.length,
        records: Object.values(dataQueries).reduce((sum, inserts) => sum + inserts.length, 0)
      }
    };

    return NextResponse.json(backupData);
  } catch (error) {
    console.error('Ошибка при создании резервной копии:', error);
    return NextResponse.json(
      { error: 'Произошла ошибка при создании резервной копии базы данных' },
      { status: 500 }
    );
  }
}
