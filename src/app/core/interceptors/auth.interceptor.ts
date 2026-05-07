import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Intentamos obtener el token del localStorage
  const token = localStorage.getItem('access_token');

  // 2. Si el token existe, clonamos la petición y agregamos el Header
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  // 3. Si no hay token, la petición sigue su curso normal (como el Login)
  return next(req);
};
