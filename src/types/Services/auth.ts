import type { JwtPayload } from "jsonwebtoken";

export type Register = {
  fullName: string;
  username: string;
  email: string;
  password: string;
};
export type Login = {
  email: string;
  password: string;
};

export type ChangePassword = {
  oldPassword: string;
  newPassword: string;
};

export interface DecodedRefreshToken extends JwtPayload {
  _id: string;
  tokenType: string;
}
