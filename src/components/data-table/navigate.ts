import { useNavigate as useRouterNavigate } from 'react-router-dom';

/** The grid asks for `{ to }`. This app's router takes a path. */
export function useNavigate() {
  const navigate = useRouterNavigate();

  return (target: { to: string }): void => {
    navigate(target.to);
  };
}
