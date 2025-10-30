import axios from "axios";
import type { iUser } from "./UserModel";

export class UserApi {
  public async getUsers(): Promise<(iUser & { id: string })[]> {
    return axios.get("/api/users");
  }

  public async getUserById(userId: string): Promise<iUser & { id: string }> {
    return axios.get(`/api/users/${userId}`);
  }

  public async searchUsers(query: string): Promise<(iUser & { id: string })[]> {
    return axios.get("/api/users/search", { params: { q: query } });
  }

  public async createUser(user: iUser): Promise<iUser & { id: string }> {
    return axios.post("/api/users", user);
  }

  public async updateUser(
    userId: string,
    user: iUser
  ): Promise<iUser & { id: string }> {
    return axios.put(`/api/users/${userId}`, user);
  }

  public async patchUser(
    userId: string,
    user: Partial<iUser>
  ): Promise<iUser & { id: string }> {
    return axios.patch(`/api/users/${userId}`, user);
  }

  public async deleteUser(userId: string): Promise<iUser & { id: string }> {
    return axios.delete(`/api/users/${userId}`);
  }
}
