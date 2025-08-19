# Development Guidelines

## Overview
This document outlines the development guidelines and best practices for the Mereka Golang backend project.

## Code Organization Principles

### 1. Clean Architecture Layers
Maintain strict separation between layers:
- **Handlers**: Only HTTP concerns, no business logic
- **Services**: Business logic and orchestration
- **Repositories**: Data access only
- **Models**: Domain entities and data structures

### 2. Dependency Direction
Dependencies should always point inward:
```
Handlers → Services → Repositories → Models
```

### 3. Interface Usage
- Define interfaces in the consuming package
- Use dependency injection for all external dependencies
- Keep interfaces small and focused (Interface Segregation Principle)

## File Naming Conventions

### Go Files
- Use snake_case for file names: `user_service.go`, `auth_handler.go`
- Suffix with the component type: `_handler.go`, `_service.go`, `_repository.go`
- Use descriptive names that indicate the domain: `user_`, `auth_`, `hub_`

### Test Files
- Use `_test.go` suffix for test files
- Mirror the structure of the source file: `user_service_test.go`
- Use `_integration_test.go` for integration tests

### Documentation Files
- Use kebab-case for markdown files: `getting-started.md`, `api-documentation.md`
- Use descriptive names that indicate content

## Code Structure Patterns

### Handler Pattern
```go
func (h *UserHandler) GetProfile(c *gin.Context) {
    // 1. Extract and validate input
    userID := c.GetString("user_id")
    if userID == "" {
        // Return error
        return
    }
    
    // 2. Call service
    profile, err := h.userService.GetProfile(c.Request.Context(), userID)
    if err != nil {
        // Handle error
        return
    }
    
    // 3. Format and return response
    c.JSON(200, APIResponse[*UserProfile]{
        Success: true,
        Data:    profile,
    })
}
```

### Service Pattern
```go
func (s *UserService) GetProfile(ctx context.Context, userID string) (*UserProfile, error) {
    // 1. Business validation
    if err := s.validateUserID(userID); err != nil {
        return nil, err
    }
    
    // 2. Repository calls
    user, err := s.userRepo.GetByID(ctx, userID)
    if err != nil {
        return nil, fmt.Errorf("failed to get user: %w", err)
    }
    
    // 3. Business logic
    profile := s.buildUserProfile(user)
    
    // 4. Return result
    return profile, nil
}
```

### Repository Pattern
```go
func (r *userRepository) GetByID(ctx context.Context, id string) (*User, error) {
    var user User
    
    err := r.db.WithContext(ctx).
        Preload("Profile").
        First(&user, "id = ?", id).Error
        
    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, ErrUserNotFound
        }
        return nil, fmt.Errorf("database error: %w", err)
    }
    
    return &user, nil
}
```

## Error Handling Guidelines

### Error Types
```go
// Domain-specific errors
var (
    ErrUserNotFound     = errors.New("user not found")
    ErrUserExists       = errors.New("user already exists")
    ErrInvalidUserData  = errors.New("invalid user data")
    ErrUnauthorized     = errors.New("unauthorized access")
)

// Application errors with context
type AppError struct {
    Code    string `json:"code"`
    Message string `json:"message"`
    Details any    `json:"details,omitempty"`
}
```

### Error Handling Pattern
```go
// In services
if err != nil {
    s.logger.Error("operation failed", 
        zap.Error(err),
        zap.String("user_id", userID),
        zap.String("operation", "get_profile"))
    return nil, fmt.Errorf("failed to get user profile: %w", err)
}

// In handlers
if err != nil {
    switch {
    case errors.Is(err, ErrUserNotFound):
        c.JSON(404, APIResponse[any]{
            Success: false,
            Error: &AppError{
                Code:    "USER_NOT_FOUND",
                Message: "User not found",
            },
        })
    default:
        c.JSON(500, APIResponse[any]{
            Success: false,
            Error: &AppError{
                Code:    "INTERNAL_ERROR", 
                Message: "Internal server error",
            },
        })
    }
    return
}
```

## Testing Guidelines

### Unit Test Structure
```go
func TestUserService_GetProfile(t *testing.T) {
    // Arrange
    mockRepo := &mocks.MockUserRepository{}
    logger := zap.NewNop()
    service := NewUserService(mockRepo, logger)
    
    userID := "test-user-id"
    expectedUser := &User{ID: userID, Name: "Test User"}
    
    mockRepo.On("GetByID", mock.Anything, userID).Return(expectedUser, nil)
    
    // Act
    profile, err := service.GetProfile(context.Background(), userID)
    
    // Assert
    assert.NoError(t, err)
    assert.NotNil(t, profile)
    assert.Equal(t, expectedUser.Name, profile.Name)
    mockRepo.AssertExpectations(t)
}
```

## Documentation Standards

### Code Comments
```go
// GetProfile retrieves the user profile for the given user ID.
// It includes user basic information, preferences, and associated data.
// Returns ErrUserNotFound if the user doesn't exist.
func (s *UserService) GetProfile(ctx context.Context, userID string) (*UserProfile, error) {
    // Implementation
}
```

### Swagger Documentation
```go
// @Summary Get user profile
// @Description Get the profile of the currently authenticated user
// @Tags Users
// @Security BearerAuth
// @Produce json
// @Success 200 {object} models.APIResponse[models.UserProfile] "User profile retrieved successfully"
// @Failure 401 {object} models.APIResponse[any] "Unauthorized"
// @Failure 404 {object} models.APIResponse[any] "User not found"
// @Failure 500 {object} models.APIResponse[any] "Internal server error"
// @Router /users/profile [get]
func (h *UserHandler) GetProfile(c *gin.Context) {
    // Implementation
}
```

## Git Workflow

### Branch Naming
- Feature branches: `feature/user-authentication`, `feature/hub-management`
- Bug fixes: `fix/login-validation`, `fix/database-connection`
- Hotfixes: `hotfix/security-patch`, `hotfix/critical-bug`

### Commit Messages
Use conventional commits format:
```
feat(auth): add Firebase authentication integration
fix(database): resolve connection pool exhaustion
docs(api): update authentication endpoints documentation
refactor(handlers): extract common response formatting
test(services): add unit tests for user service
```

## Performance Guidelines

### Database Queries
```go
// Good: Use preloading to avoid N+1 queries
users, err := r.db.Preload("Profile").Preload("Hubs").Find(&users).Error

// Good: Use pagination for large datasets
users, err := r.db.Limit(limit).Offset(offset).Find(&users).Error

// Good: Use select to limit columns
var userIDs []string
err := r.db.Model(&User{}).Select("id").Pluck("id", &userIDs).Error
```

### Caching Patterns
```go
// Cache frequently accessed data
func (s *UserService) GetProfile(ctx context.Context, userID string) (*UserProfile, error) {
    // Try cache first
    if cached := s.cache.Get(ctx, "user:"+userID); cached != nil {
        return cached, nil
    }
    
    // Fetch from database
    profile, err := s.userRepo.GetProfile(ctx, userID)
    if err != nil {
        return nil, err
    }
    
    // Cache the result
    s.cache.Set(ctx, "user:"+userID, profile, 15*time.Minute)
    
    return profile, nil
}
```

## Security Guidelines

### Input Validation
```go
type CreateUserRequest struct {
    Email    string `json:"email" validate:"required,email,max=255"`
    Name     string `json:"name" validate:"required,min=2,max=100"`
    Password string `json:"password" validate:"required,min=8,max=128"`
}

func (h *UserHandler) CreateUser(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        // Handle binding error
        return
    }
    
    if err := h.validator.Struct(&req); err != nil {
        // Handle validation error
        return
    }
    
    // Process request
}
```

### Authentication
```go
// Always verify Firebase tokens
func (h *UserHandler) ProtectedEndpoint(c *gin.Context) {
    userID := c.GetString("user_id")
    if userID == "" {
        c.JSON(401, APIResponse[any]{
            Success: false,
            Error: &AppError{
                Code:    "UNAUTHORIZED",
                Message: "Authentication required",
            },
        })
        return
    }
    
    // Process authenticated request
}
```

## Logging Guidelines

### Structured Logging
```go
func (s *UserService) CreateUser(ctx context.Context, req CreateUserRequest) (*User, error) {
    logger := s.logger.With(
        zap.String("operation", "create_user"),
        zap.String("email", req.Email),
        zap.String("request_id", getRequestID(ctx)),
    )
    
    logger.Info("starting user creation")
    
    user, err := s.userRepo.Create(ctx, &User{
        Email: req.Email,
        Name:  req.Name,
    })
    
    if err != nil {
        logger.Error("failed to create user", zap.Error(err))
        return nil, err
    }
    
    logger.Info("user created successfully", zap.String("user_id", user.ID))
    return user, nil
}
```

## Code Review Checklist

### Functionality
- [ ] Code works as intended
- [ ] Edge cases are handled
- [ ] Error conditions are properly managed
- [ ] Business logic is correct

### Code Quality
- [ ] Code is readable and well-structured
- [ ] Functions are focused and not too long
- [ ] Variable and function names are descriptive
- [ ] No code duplication
- [ ] Proper separation of concerns

### Testing
- [ ] Unit tests cover new functionality
- [ ] Integration tests verify end-to-end behavior
- [ ] Tests are reliable and not flaky
- [ ] Test coverage is adequate

### Security
- [ ] Input validation is implemented
- [ ] Authentication/authorization is correct
- [ ] No sensitive data in logs
- [ ] SQL injection protection

### Performance
- [ ] Database queries are optimized
- [ ] No N+1 query problems
- [ ] Appropriate caching is used
- [ ] Context is used for cancellation

### Documentation
- [ ] Code is self-documenting
- [ ] Complex logic is commented
- [ ] API documentation is updated
- [ ] README is updated if needed