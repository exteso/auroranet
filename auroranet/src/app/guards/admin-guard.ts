import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';
import { map, take, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Use async authentication check to wait for Firebase to initialize
  return authService.isAuthenticatedAsync().pipe(
    take(1), // Take only the first emission to avoid multiple checks
    switchMap(isAuthenticated => {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
        return of(false);
      }

      // Check if user has admin role from Firestore
      return authService.isAdmin().pipe(
        map(isAdmin => {
          if (!isAdmin) {
            // Redirect to user dashboard if not admin
            router.navigate(['/user/dashboard']);
            return false;
          }
          return true;
        })
      );
    })
  );
};
