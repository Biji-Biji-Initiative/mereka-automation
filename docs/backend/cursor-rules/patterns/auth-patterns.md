# Firebase Authentication Patterns

## Overview
This document contains Firebase Authentication patterns used in the Mereka Golang backend.

## Firebase Middleware Pattern

### Basic Firebase Auth Middleware
```go
// FirebaseAuth verifies Firebase ID tokens and sets user context
func FirebaseAuth(firebaseApp *firebase.App) gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(401, APIResponse[any]{
                Success: false,
                Error: &AppError{
                    Code:    "MISSING_AUTH_HEADER",
                    Message: "Authorization header is required",
                },
            })
            c.Abort()
            return
        }

        tokenString := strings.TrimPrefix(authHeader, "Bearer ")
        if tokenString == authHeader {
            c.JSON(401, APIResponse[any]{
                Success: false,
                Error: &AppError{
                    Code:    "INVALID_AUTH_FORMAT",
                    Message: "Authorization header must be in format: Bearer <token>",
                },
            })
            c.Abort()
            return
        }

        client, err := firebaseApp.Auth(c.Request.Context())
        if err != nil {
            c.JSON(500, APIResponse[any]{
                Success: false,
                Error: &AppError{
                    Code:    "FIREBASE_CLIENT_ERROR",
                    Message: "Failed to create Firebase client",
                },
            })
            c.Abort()
            return
        }

        token, err := client.VerifyIDToken(c.Request.Context(), tokenString)
        if err != nil {
            c.JSON(401, APIResponse[any]{
                Success: false,
                Error: &AppError{
                    Code:    "INVALID_TOKEN",
                    Message: "Invalid Firebase ID token",
                },
            })
            c.Abort()
            return
        }

        // Set user information in context
        c.Set("user_id", token.UID)
        c.Set("user_email", token.Claims["email"])
        c.Set("custom_claims", token.Claims)
        c.Next()
    }
}
```

### Optional Auth Middleware
```go
// OptionalFirebaseAuth verifies Firebase ID tokens if present
func OptionalFirebaseAuth(firebaseApp *firebase.App) gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.Next()
            return
        }

        tokenString := strings.TrimPrefix(authHeader, "Bearer ")
        if tokenString == authHeader {
            c.Next()
            return
        }

        client, err := firebaseApp.Auth(c.Request.Context())
        if err != nil {
            c.Next()
            return
        }

        token, err := client.VerifyIDToken(c.Request.Context(), tokenString)
        if err != nil {
            c.Next()
            return
        }

        // Set user information in context if token is valid
        c.Set("user_id", token.UID)
        c.Set("user_email", token.Claims["email"])
        c.Set("custom_claims", token.Claims)
        c.Next()
    }
}
```

## Firebase User Management Patterns

### Creating User Profile from Firebase Token
```go
func (s *UserService) CreateUserFromFirebaseToken(ctx context.Context, token *auth.Token) (*User, error) {
    // Check if user already exists
    existingUser, err := s.userRepo.GetByFirebaseUID(ctx, token.UID)
    if err == nil {
        return existingUser, nil
    }

    // Create new user from Firebase token
    user := &User{
        FirebaseUID: token.UID,
        Email:       token.Claims["email"].(string),
        Name:        token.Claims["name"].(string),
        PhotoURL:    token.Claims["picture"].(string),
        Verified:    token.Claims["email_verified"].(bool),
    }

    if err := s.userRepo.Create(ctx, user); err != nil {
        return nil, fmt.Errorf("failed to create user: %w", err)
    }

    return user, nil
}
```

### Custom Claims Pattern
```go
func (s *AuthService) SetUserClaims(ctx context.Context, userID string, claims map[string]interface{}) error {
    client, err := s.firebaseApp.Auth(ctx)
    if err != nil {
        return fmt.Errorf("failed to get auth client: %w", err)
    }

    // Set custom claims
    if err := client.SetCustomUserClaims(ctx, userID, claims); err != nil {
        return fmt.Errorf("failed to set custom claims: %w", err)
    }

    // Log the operation
    s.logger.Info("custom claims set",
        zap.String("user_id", userID),
        zap.Any("claims", claims),
    )

    return nil
}
```

## Role-Based Access Control Pattern

### Role Middleware
```go
func RequireRole(firebaseApp *firebase.App, requiredRole string) gin.HandlerFunc {
    return gin.HandlerFunc(func(c *gin.Context) {
        // First apply Firebase auth
        FirebaseAuth(firebaseApp)(c)
        if c.IsAborted() {
            return
        }

        // Check custom claims for role
        customClaims, exists := c.Get("custom_claims")
        if !exists {
            c.JSON(403, APIResponse[any]{
                Success: false,
                Error: &AppError{
                    Code:    "MISSING_CLAIMS",
                    Message: "No custom claims found",
                },
            })
            c.Abort()
            return
        }

        claims, ok := customClaims.(map[string]interface{})
        if !ok {
            c.JSON(403, APIResponse[any]{
                Success: false,
                Error: &AppError{
                    Code:    "INVALID_CLAIMS",
                    Message: "Invalid claims format",
                },
            })
            c.Abort()
            return
        }

        role, hasRole := claims["role"].(string)
        if !hasRole || role != requiredRole {
            c.JSON(403, APIResponse[any]{
                Success: false,
                Error: &AppError{
                    Code:    "INSUFFICIENT_PERMISSIONS",
                    Message: "Insufficient permissions",
                },
            })
            c.Abort()
            return
        }

        c.Next()
    })
}
```

### Multi-Role Authorization
```go
func RequireAnyRole(firebaseApp *firebase.App, allowedRoles ...string) gin.HandlerFunc {
    return gin.HandlerFunc(func(c *gin.Context) {
        // First apply Firebase auth
        FirebaseAuth(firebaseApp)(c)
        if c.IsAborted() {
            return
        }

        customClaims, exists := c.Get("custom_claims")
        if !exists {
            c.JSON(403, APIResponse[any]{
                Success: false,
                Error: &AppError{
                    Code:    "MISSING_CLAIMS",
                    Message: "No custom claims found",
                },
            })
            c.Abort()
            return
        }

        claims, ok := customClaims.(map[string]interface{})
        if !ok {
            c.JSON(403, APIResponse[any]{
                Success: false,
                Error: &AppError{
                    Code:    "INVALID_CLAIMS",
                    Message: "Invalid claims format",
                },
            })
            c.Abort()
            return
        }

        userRole, hasRole := claims["role"].(string)
        if !hasRole {
            c.JSON(403, APIResponse[any]{
                Success: false,
                Error: &AppError{
                    Code:    "NO_ROLE_ASSIGNED",
                    Message: "No role assigned to user",
                },
            })
            c.Abort()
            return
        }

        // Check if user has any of the allowed roles
        for _, allowedRole := range allowedRoles {
            if userRole == allowedRole {
                c.Next()
                return
            }
        }

        c.JSON(403, APIResponse[any]{
            Success: false,
            Error: &AppError{
                Code:    "INSUFFICIENT_PERMISSIONS",
                Message: "Insufficient permissions",
            },
        })
        c.Abort()
    })
}
```

## Firebase Configuration Pattern

### Environment-based Firebase Config
```go
type FirebaseConfig struct {
    ProjectID               string `mapstructure:"FIREBASE_PROJECT_ID" validate:"required"`
    PrivateKeyID           string `mapstructure:"FIREBASE_PRIVATE_KEY_ID" validate:"required"`
    PrivateKey             string `mapstructure:"FIREBASE_PRIVATE_KEY" validate:"required"`
    ClientEmail            string `mapstructure:"FIREBASE_CLIENT_EMAIL" validate:"required"`
    ClientID               string `mapstructure:"FIREBASE_CLIENT_ID" validate:"required"`
    AuthURI                string `mapstructure:"FIREBASE_AUTH_URI" validate:"required"`
    TokenURI               string `mapstructure:"FIREBASE_TOKEN_URI" validate:"required"`
    AuthProviderX509CertURL string `mapstructure:"FIREBASE_AUTH_PROVIDER_X509_CERT_URL" validate:"required"`
    ClientX509CertURL      string `mapstructure:"FIREBASE_CLIENT_X509_CERT_URL" validate:"required"`
}

func (fc *FirebaseConfig) ToServiceAccount() map[string]interface{} {
    return map[string]interface{}{
        "type":                        "service_account",
        "project_id":                  fc.ProjectID,
        "private_key_id":             fc.PrivateKeyID,
        "private_key":                fc.PrivateKey,
        "client_email":               fc.ClientEmail,
        "client_id":                  fc.ClientID,
        "auth_uri":                   fc.AuthURI,
        "token_uri":                  fc.TokenURI,
        "auth_provider_x509_cert_url": fc.AuthProviderX509CertURL,
        "client_x509_cert_url":       fc.ClientX509CertURL,
    }
}
```

### Firebase App Initialization
```go
func InitializeFirebase(config *FirebaseConfig) (*firebase.App, error) {
    serviceAccount := config.ToServiceAccount()
    
    credentials, err := json.Marshal(serviceAccount)
    if err != nil {
        return nil, fmt.Errorf("failed to marshal service account: %w", err)
    }

    opt := option.WithCredentialsJSON(credentials)
    
    firebaseConfig := &firebase.Config{
        ProjectID: config.ProjectID,
    }

    app, err := firebase.NewApp(context.Background(), firebaseConfig, opt)
    if err != nil {
        return nil, fmt.Errorf("failed to initialize Firebase app: %w", err)
    }

    return app, nil
}
```

## Best Practices

1. **Always validate tokens**: Never trust tokens without verification
2. **Use context for timeouts**: Set appropriate timeouts for Firebase operations
3. **Handle errors gracefully**: Provide meaningful error messages
4. **Log security events**: Log authentication failures and suspicious activities
5. **Use custom claims sparingly**: Only store essential authorization data
6. **Implement rate limiting**: Protect against brute force attacks
7. **Cache Firebase client**: Reuse the Firebase client instance
8. **Validate required claims**: Ensure all required user data is present

## Usage Examples

### Protecting Routes
```go
// Public route
router.POST("/auth/register", authHandler.Register)

// Protected route (requires valid Firebase token)
protected := router.Group("/api/v1")
protected.Use(FirebaseAuth(firebaseApp))
{
    protected.GET("/profile", userHandler.GetProfile)
    protected.PUT("/profile", userHandler.UpdateProfile)
}

// Admin-only routes
admin := router.Group("/api/v1/admin")
admin.Use(RequireRole(firebaseApp, "admin"))
{
    admin.GET("/users", adminHandler.ListUsers)
    admin.DELETE("/users/:id", adminHandler.DeleteUser)
}
```

### Extracting User Information
```go
func (h *UserHandler) GetProfile(c *gin.Context) {
    userID := c.GetString("user_id")
    userEmail := c.GetString("user_email")
    
    if userID == "" {
        c.JSON(401, APIResponse[any]{
            Success: false,
            Error: &AppError{
                Code:    "UNAUTHORIZED",
                Message: "User not authenticated",
            },
        })
        return
    }

    // Fetch user profile
    profile, err := h.userService.GetProfile(c.Request.Context(), userID)
    if err != nil {
        // Handle error...
    }

    c.JSON(200, APIResponse[*UserProfile]{
        Success: true,
        Data:    profile,
    })
}
``` 