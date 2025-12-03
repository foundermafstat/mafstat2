import { Request, Response } from 'express';
import { ClubService } from '../services/club.service';

export const getClubs = async (req: Request, res: Response): Promise<void> => {
  try {
    const clubs = await ClubService.getAllClubs();
    res.status(200).json(clubs);
  } catch (error) {
    console.error('Ошибка при получении клубов:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении клубов' });
  }
};

export const getClub = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const club = await ClubService.getClubById(id);
    if (!club) {
      res.status(404).json({ message: 'Клуб не найден' });
      return;
    }
    res.status(200).json(club);
  } catch (error) {
    console.error('Ошибка при получении клуба:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении клуба' });
  }
};

export const createClub = async (req: Request, res: Response): Promise<void> => {
  try {
    const club = await ClubService.createClub(req.body);
    res.status(201).json(club);
  } catch (error: any) {
    console.error('Ошибка при создании клуба:', error);
    res.status(400).json({ message: error.message || 'Ошибка сервера при создании клуба' });
  }
};

export const updateClub = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const club = await ClubService.updateClub(id, req.body);
    res.status(200).json(club);
  } catch (error: any) {
    console.error('Ошибка при обновлении клуба:', error);
    res.status(400).json({ message: error.message || 'Ошибка сервера при обновлении клуба' });
  }
};

export const deleteClub = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    await ClubService.deleteClub(id);
    res.status(200).json({ message: 'Клуб успешно удален' });
  } catch (error: any) {
    console.error('Ошибка при удалении клуба:', error);
    res.status(400).json({ message: error.message || 'Ошибка сервера при удалении клуба' });
  }
};

