import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GameState, GamePlayer, Role, GameType, Federation } from '@/types/game';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const INITIAL_PLAYERS: GamePlayer[] = Array.from({ length: 10 }, (_, i) => ({
  id: 0,
  gameId: 0,
  playerId: 0,
  role: "civilian" as Role,
  fouls: 0,
  additionalPoints: 0,
  slotNumber: i + 1,
  createdAt: "",
  updatedAt: "",
  name: "",
  surname: "",
}));

const INITIAL_STATE: GameState = {
  players: INITIAL_PLAYERS,
  federation: "",
  club: "",
  table: 1,
  dateTime: new Date().toISOString(),
  judge: "",
  gameType: "classic_10" as GameType,
  nightActions: [],
  dayVotes: [],
  bestMove: {
    killedPlayer: "",
    nominatedPlayers: [],
  },
  gameId: 0,
  name: "",
  description: "",
  result: "",
};

interface GameFormState {
  gameState: GameState;
  federations: Federation[];
  isFederationsLoading: boolean;
  formType: 'create' | 'edit' | null;
  isFormSubmitted: boolean;
  formPath: string | null;
  updateGameState: (newState: Partial<GameState>) => void;
  updatePlayer: (slotNumber: number, field: keyof GamePlayer, value: string | number) => void;
  resetGameState: () => void;
  setFederations: (federations: Federation[]) => void;
  setFederationsLoading: (isLoading: boolean) => void;
  setFormType: (type: 'create' | 'edit' | null) => void;
  setFormPath: (path: string | null) => void;
  setFormSubmitted: (submitted: boolean) => void;
}

export const useGameFormStore = create<GameFormState>()(
  persist(
    (set) => ({
      gameState: INITIAL_STATE,
      federations: [],
      isFederationsLoading: true,
      formType: null,
      isFormSubmitted: false,
      formPath: null,
      
      updateGameState: (newState) => 
        set((state) => ({
          gameState: { ...state.gameState, ...newState },
          // Если обновляем состояние, значит форма не отправлена
          isFormSubmitted: false
        })),
      
      updatePlayer: (slotNumber, field, value) => 
        set(state => {
          // Проверка на undefined или null перед работой со значением
          if (slotNumber === undefined || slotNumber === null) {
            console.error('slotNumber is undefined or null');
            return state; // Возвращаем текущее состояние без изменений
          }
          
          console.log(`Updating player, slotNumber:${slotNumber}, field:${String(field)}, value:${String(value)}`);
          
          // Преобразуем в число для гарантированного сравнения
          const slotToFind = Number(slotNumber);
          
          // Проверка на NaN и другие невалидные значения
          if (Number.isNaN(slotToFind) || slotToFind <= 0) {
            console.error(`Invalid slotNumber provided: ${slotNumber}`);
            return state; // Возвращаем текущее состояние без изменений
          }
          
          // Найдем индекс игрока с указанным slotNumber
          const playerIndex = state.gameState.players.findIndex(
            player => Number(player.slotNumber) === slotToFind
          );

          // Если игрок не найден, вернем сообщение об ошибке
          if (playerIndex === -1) {
            console.error(`Player with slotNumber ${slotToFind} not found`);
            return state; // Возвращаем текущее состояние без изменений
          }

          console.log(`Found player at index ${playerIndex}:`, state.gameState.players[playerIndex]);

          // Создаем новый массив игроков
          const updatedPlayers = state.gameState.players.map((player, index) => {
            // Если это тот игрок, которого мы хотим обновить
            if (index === playerIndex) {
              // Создаем нового игрока с обновленным полем
              const updatedPlayer = { ...player };
              
              // Здесь мы обрабатываем разные типы полей
              if (field === "role") {
                updatedPlayer.role = value as Role;
              } else if (field === "fouls") {
                updatedPlayer.fouls = Number(value);
              } else if (field === "playerId") {
                updatedPlayer.playerId = Number(value);
              } else if (field === "additionalPoints") {
                updatedPlayer.additionalPoints = Number(value);
              } else {
                // Для других полей - обрабатываем безопасно
                // Избегаем ошибок типизации
                if (typeof updatedPlayer[field as keyof typeof updatedPlayer] === 'string') {
                  (updatedPlayer as Record<keyof GamePlayer, string | number>)[field] = String(value);
                } else if (typeof updatedPlayer[field as keyof typeof updatedPlayer] === 'number') {
                  (updatedPlayer as Record<keyof GamePlayer, string | number>)[field] = Number(value);
                } else {
                  (updatedPlayer as Record<keyof GamePlayer, string | number | boolean>)[field] = value;
                }
              }
              
              console.log("Updated player to:", updatedPlayer);
              return updatedPlayer;
            }
            return player;
          });
          
          // Создаем новое состояние
          const newState = {
            ...state,
            gameState: {
              ...state.gameState,
              players: updatedPlayers
            },
            isFormSubmitted: false
          };
          
          return newState;
        }),
      
      resetGameState: () => 
        set(() => ({ 
          gameState: INITIAL_STATE,
          isFormSubmitted: true 
        })),
        
      setFederations: (federations) =>
        set(() => ({ federations, isFederationsLoading: false })),
        
      setFederationsLoading: (isLoading) =>
        set(() => ({ isFederationsLoading: isLoading })),
        
      setFormType: (type) =>
        set(() => ({ formType: type })),
        
      setFormPath: (path) =>
        set(() => ({ formPath: path })),
        
      setFormSubmitted: (submitted) =>
        set(() => ({ isFormSubmitted: submitted })),
    }),
    {
      name: 'game-form-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // В localStorage сохраняем только если форма не отправлена
        if (state.isFormSubmitted) {
          return { isFormSubmitted: true, formType: state.formType, formPath: state.formPath };
        }
        
        // Сохраняем состояние только для соответствующего типа формы и пути
        return {
          gameState: state.gameState,
          federations: state.federations,
          formType: state.formType,
          formPath: state.formPath,
          isFormSubmitted: state.isFormSubmitted,
        };
      },
    }
  )
);

/**
 * Хук для определения пути и типа формы, который автоматически устанавливает 
 * нужный тип формы (create/edit) на основе пути страницы
 */
export function useGameFormPath() {
  const pathname = usePathname();
  const setFormType = useGameFormStore((state) => state.setFormType);
  const setFormPath = useGameFormStore((state) => state.setFormPath);
  const formType = useGameFormStore((state) => state.formType);
  const formPath = useGameFormStore((state) => state.formPath);
  const isFormSubmitted = useGameFormStore((state) => state.isFormSubmitted);
  const resetGameState = useGameFormStore((state) => state.resetGameState);
  
  useEffect(() => {
    // Если путь изменился и не совпадает с сохраненным
    if (pathname && pathname !== formPath) {
      setFormPath(pathname);
      
      if (pathname.includes('/games/create')) {
        setFormType('create');
        console.log('Установлен тип формы: создание игры');
      } else if (pathname.match(/\/games\/\d+\/edit/)) {
        setFormType('edit');
        console.log('Установлен тип формы: редактирование игры');
      } else {
        // Если мы покинули страницы форм, сбрасываем состояние
        setFormType(null);
        if (formType) {
          console.log('Покинули страницу формы, сбрасываем состояние');
          resetGameState();
        }
      }
    }
    
    // Если форма была отправлена и мы все еще на странице формы, сбрасываем состояние
    if (isFormSubmitted && formType) {
      resetGameState();
    }
  }, [pathname, setFormType, setFormPath, formPath, formType, isFormSubmitted, resetGameState]);
  
  return { formType, pathname };
}

// Хук для загрузки федераций
export function useFetchFederations() {
  const setFederations = useGameFormStore((state) => state.setFederations);
  const setLoading = useGameFormStore((state) => state.setFederationsLoading);
  
  useEffect(() => {
    async function fetchFederations() {
      try {
        setLoading(true);
        const response = await fetch('/api/federations');
        
        if (!response.ok) {
          throw new Error('Ошибка при загрузке федераций');
        }
        
        const data = await response.json();
        const federationsArray = Array.isArray(data) ? data : data.rows || [];
        
        setFederations(federationsArray);
      } catch (error) {
        console.error('Ошибка при загрузке федераций:', error);
        setFederations([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchFederations();
  }, [setFederations, setLoading]);
}
