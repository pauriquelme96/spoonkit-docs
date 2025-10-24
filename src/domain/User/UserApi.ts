import axios from 'axios';
import type { UserModel } from "./UserModel";

export class UserApi {
  public async getUsers(): Promise<UserModel[]> {
    const response = await axios.get('/api/users');
    return response.data;
  }

  public async getUserById(userId: string): Promise<UserModel> {
    const response = await axios.get(`/api/users/${userId}`);
    return response.data;
  }

  public async searchUsers(query: string): Promise<UserModel[]> {
    const response = await axios.get('/api/users/search', { params: { q: query } });
    return response.data;
  }

  public async createUser(user: UserModel): Promise<UserModel> {
    const response = await axios.post('/api/users', user);
    return response.data;
  }

  public async updateUser(userId: string, user: UserModel): Promise<UserModel> {
    const response = await axios.put(`/api/users/${userId}`, user);
    return response.data;
  }

  public async deleteUser(userId: string): Promise<UserModel> {
    const response = await axios.delete(`/api/users/${userId}`);
    return response.data;
  }
}
