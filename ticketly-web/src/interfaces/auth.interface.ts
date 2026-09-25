export interface IAdminUser {
  id: string
  name: string
  email: string
}

export interface ILogin {
  email: string
  password: string
}

export interface ILoginResponse {
  accessToken: string
  user: IAdminUser
}
