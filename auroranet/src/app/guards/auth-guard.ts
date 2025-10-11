import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Use async authentication check to wait for Firebase to initialize
  return authService.isAuthenticatedAsync().pipe(
    take(1), // Take only the first emission to avoid multiple checks
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      }

      // Redirect to login page if not authenticated
      router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
      return false;
    })
  );
};
