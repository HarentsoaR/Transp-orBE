export type AuthUser = {
  id: string;
  email: string;
  profile?: {
    id: string;
    name: string;
    permissions: { code: string }[];
  };
};
