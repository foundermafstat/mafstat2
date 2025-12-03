// Клиентские обертки для API запросов
// Эти функции заменяют серверные экшены и работают напрямую с API сервера

import { api, apiRequest } from './api';
import { useSession } from 'next-auth/react';

// ========== USERS ==========
export async function getUsers(clubId?: number) {
  const endpoint = clubId ? `/users?clubId=${clubId}` : '/users';
  return api.get(endpoint);
}

export async function getUsersWithStats() {
  return api.get('/users/stats');
}

export async function getUserById(id: string) {
  return api.get(`/users/${id}`);
}

export async function createUser(userData: any) {
  return api.post('/users', userData);
}

export async function updateUser(id: string, userData: any) {
  return api.put(`/users/${id}`, userData);
}

export async function deleteUser(id: string) {
  return api.delete(`/users/${id}`);
}

export async function updateProfile(profileData: any) {
  return api.put('/users/profile', profileData);
}

export async function changePassword(passwordData: { currentPassword: string; newPassword: string }) {
  return api.post('/users/change-password', passwordData);
}

export async function getPremiumStatus() {
  return api.get('/users/premium-status');
}

export async function usePremiumNight(gameId: string) {
  return api.post('/users/use-premium-night', { gameId });
}

// ========== CLUBS ==========
export async function getAllClubs() {
  return api.get('/clubs');
}

export async function getClubById(id: string) {
  return api.get(`/clubs/${id}`);
}

export async function createClub(clubData: any) {
  return api.post('/clubs', clubData);
}

export async function updateClub(id: string, clubData: any) {
  return api.put(`/clubs/${id}`, clubData);
}

export async function deleteClub(id: string) {
  return api.delete(`/clubs/${id}`);
}

// ========== FEDERATIONS ==========
export async function getAllFederations() {
  return api.get('/federations');
}

export async function getFederationById(id: string) {
  return api.get(`/federations/${id}`);
}

export async function createFederation(federationData: any) {
  return api.post('/federations', federationData);
}

export async function updateFederation(id: string, federationData: any) {
  return api.put(`/federations/${id}`, federationData);
}

export async function deleteFederation(id: string) {
  return api.delete(`/federations/${id}`);
}

// ========== GAMES ==========
export async function getAllGames() {
  return api.get('/games');
}

export async function getGameById(id: string) {
  return api.get(`/games/${id}`);
}

export async function createGame(gameData: any) {
  return api.post('/games', gameData);
}

export async function updateGame(id: string, gameData: any) {
  return api.put(`/games/${id}`, gameData);
}

export async function deleteGame(id: string) {
  return api.delete(`/games/${id}`);
}

export async function addPlayerToGame(gameId: string, playerId: string, role: string, slotNumber: number) {
  return api.post(`/games/${gameId}/players`, { playerId, role, slotNumber });
}

export async function removePlayerFromGame(gameId: string, gamePlayerId: string) {
  return api.delete(`/games/${gameId}/players/${gamePlayerId}`);
}

// ========== PAYMENTS ==========
export async function getAllPayments() {
  return api.get('/payments');
}

export async function getUserPayments() {
  return api.get('/payments/user');
}

export async function getPaymentById(id: string) {
  return api.get(`/payments/${id}`);
}

export async function createPayment(paymentData: any) {
  return api.post('/payments', paymentData);
}

export async function updatePayment(id: string, paymentData: any) {
  return api.put(`/payments/${id}`, paymentData);
}

export async function deletePayment(id: string) {
  return api.delete(`/payments/${id}`);
}

export async function createCheckoutSession(planId: 'monthly' | 'yearly') {
  return api.post('/payments/create-checkout', { planId });
}

export async function checkPaymentStatus(sessionId: string) {
  return api.post('/payments/check-status', { sessionId });
}

export async function cancelSubscription() {
  return api.post('/payments/cancel-subscription', {});
}

// ========== ADMIN ==========
export async function getAdminStats() {
  return api.get('/admin/stats');
}

export async function getAdminUsers() {
  return api.get('/admin/users');
}

export async function getAdminUser(id: string) {
  return api.get(`/admin/users/${id}`);
}

export async function updateAdminUser(id: string, userData: any) {
  return api.put(`/admin/users/${id}`, userData);
}

export async function deleteAdminUser(id: string) {
  return api.delete(`/admin/users/${id}`);
}

export async function getAdminProducts() {
  return api.get('/admin/products');
}

export async function getAdminPayments() {
  return api.get('/admin/payments');
}

export async function getAdminSubscriptions() {
  return api.get('/admin/subscriptions');
}

