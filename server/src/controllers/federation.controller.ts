import { Request, Response } from 'express';
import { FederationService } from '../services/federation.service';

export const getFederations = async (req: Request, res: Response): Promise<void> => {
  try {
    const federations = await FederationService.getAllFederations();
    res.status(200).json(federations);
  } catch (error) {
    console.error('Ошибка при получении федераций:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении федераций' });
  }
};

export const getFederation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const federation = await FederationService.getFederationById(id);
    if (!federation) {
      res.status(404).json({ message: 'Федерация не найдена' });
      return;
    }
    res.status(200).json(federation);
  } catch (error) {
    console.error('Ошибка при получении федерации:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении федерации' });
  }
};

export const createFederation = async (req: Request, res: Response): Promise<void> => {
  try {
    const federation = await FederationService.createFederation(req.body);
    res.status(201).json(federation);
  } catch (error: any) {
    console.error('Ошибка при создании федерации:', error);
    res.status(400).json({ message: error.message || 'Ошибка сервера при создании федерации' });
  }
};

export const updateFederation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const federation = await FederationService.updateFederation(id, req.body);
    res.status(200).json(federation);
  } catch (error: any) {
    console.error('Ошибка при обновлении федерации:', error);
    res.status(400).json({ message: error.message || 'Ошибка сервера при обновлении федерации' });
  }
};

export const deleteFederation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    await FederationService.deleteFederation(id);
    res.status(200).json({ message: 'Федерация успешно удалена' });
  } catch (error: any) {
    console.error('Ошибка при удалении федерации:', error);
    res.status(400).json({ message: error.message || 'Ошибка сервера при удалении федерации' });
  }
};

export const getFederationPlayers = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const players = await FederationService.getFederationPlayers(id);
    if (players === null) {
      res.status(404).json({ message: 'Федерация не найдена' });
      return;
    }
    res.status(200).json(players);
  } catch (error) {
    console.error('Ошибка при получении игроков федерации:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении игроков федерации' });
  }
};

