export interface UserObjType {
  _id:string;
  auth0Id?: string;
  username: string;
  displayName: string;
  prfImg: string;
  role?: string;
  lastAct?: string;
  status?: string;
  offConv?: string[];
}

export interface User extends UserObjType {
}

export type UserMap = Record<string,User|undefined>;
