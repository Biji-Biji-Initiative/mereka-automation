# Swagger Documentation Examples

This document provides comprehensive examples of how to document API endpoints using Swagger annotations in the Mereka Golang backend.

## Basic Swagger Setup

### Main Application Swagger Info

```go
// @title Mereka Backend API
// @version 1.0
// @description This is the Mereka platform backend API server
// @termsOfService https://mereka.com/terms

// @contact.name API Support
// @contact.url https://mereka.com/support
// @contact.email support@mereka.com

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

// @schemes http https
func main() {
    // Application code
}
```

## Authentication Endpoints

### User Registration

```go
// @Summary Register a new user
// @Description Register a new user with email and Firebase UID
// @Tags Authentication
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "User registration data"
// @Success 201 {object} models.APIResponse[models.User] "User registered successfully"
// @Failure 400 {object} models.APIResponse[any] "Invalid request data"
// @Failure 409 {object} models.APIResponse[any] "User already exists"
// @Failure 500 {object} models.APIResponse[any] "Internal server error"
// @Router /auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
    // Implementation
}

// RegisterRequest represents the user registration request
type RegisterRequest struct {
    Email       string `json:"email" validate:"required,email" example:"user@example.com"`
    Name        string `json:"name" validate:"required,min=2,max=100" example:"John Doe"`
    FirebaseUID string `json:"firebase_uid" validate:"required" example:"firebase-uid-123"`
} // @name RegisterRequest
```

### User Login

```go
// @Summary Authenticate user
// @Description Authenticate user with Firebase ID token
// @Tags Authentication
// @Accept json
// @Produce json
// @Param request body LoginRequest true "Login credentials"
// @Success 200 {object} models.APIResponse[LoginResponse] "Login successful"
// @Failure 400 {object} models.APIResponse[any] "Invalid request data"
// @Failure 401 {object} models.APIResponse[any] "Invalid credentials"
// @Failure 500 {object} models.APIResponse[any] "Internal server error"
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
    // Implementation
}

// LoginRequest represents the login request
type LoginRequest struct {
    IDToken string `json:"id_token" validate:"required" example:"firebase-id-token"`
} // @name LoginRequest

// LoginResponse represents the login response
type LoginResponse struct {
    User        *User  `json:"user"`
    AccessToken string `json:"access_token" example:"jwt-access-token"`
    ExpiresIn   int64  `json:"expires_in" example:"3600"`
} // @name LoginResponse
```

### Logout

```go
// @Summary Logout user
// @Description Logout the currently authenticated user
// @Tags Authentication
// @Security BearerAuth
// @Produce json
// @Success 200 {object} models.APIResponse[any] "Logout successful"
// @Failure 401 {object} models.APIResponse[any] "Unauthorized"
// @Failure 500 {object} models.APIResponse[any] "Internal server error"
// @Router /auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
    // Implementation
}
```

## User Management Endpoints

### Get User Profile

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

### Update User Profile

```go
// @Summary Update user profile
// @Description Update the profile of the currently authenticated user
// @Tags Users
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body UpdateProfileRequest true "Profile update data"
// @Success 200 {object} models.APIResponse[models.UserProfile] "Profile updated successfully"
// @Failure 400 {object} models.APIResponse[any] "Invalid request data"
// @Failure 401 {object} models.APIResponse[any] "Unauthorized"
// @Failure 404 {object} models.APIResponse[any] "User not found"
// @Failure 500 {object} models.APIResponse[any] "Internal server error"
// @Router /users/profile [put]
func (h *UserHandler) UpdateProfile(c *gin.Context) {
    // Implementation
}

// UpdateProfileRequest represents the profile update request
type UpdateProfileRequest struct {
    Name        *string `json:"name,omitempty" validate:"omitempty,min=2,max=100" example:"John Doe"`
    Bio         *string `json:"bio,omitempty" validate:"omitempty,max=500" example:"Software developer"`
    Location    *string `json:"location,omitempty" validate:"omitempty,max=100" example:"San Francisco, CA"`
    Website     *string `json:"website,omitempty" validate:"omitempty,url" example:"https://johndoe.com"`
    LinkedInURL *string `json:"linkedin_url,omitempty" validate:"omitempty,url" example:"https://linkedin.com/in/johndoe"`
} // @name UpdateProfileRequest
```

### Get User by ID

```go
// @Summary Get user by ID
// @Description Get a specific user by their ID
// @Tags Users
// @Security BearerAuth
// @Produce json
// @Param id path string true "User ID" format(uuid)
// @Success 200 {object} models.APIResponse[models.User] "User retrieved successfully"
// @Failure 400 {object} models.APIResponse[any] "Invalid user ID"
// @Failure 401 {object} models.APIResponse[any] "Unauthorized"
// @Failure 404 {object} models.APIResponse[any] "User not found"
// @Failure 500 {object} models.APIResponse[any] "Internal server error"
// @Router /users/{id} [get]
func (h *UserHandler) GetUser(c *gin.Context) {
    // Implementation
}
```

## Hub Management Endpoints

### Create Hub

```go
// @Summary Create a new hub
// @Description Create a new hub for the authenticated user
// @Tags Hubs
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body CreateHubRequest true "Hub creation data"
// @Success 201 {object} models.APIResponse[models.Hub] "Hub created successfully"
// @Failure 400 {object} models.APIResponse[any] "Invalid request data"
// @Failure 401 {object} models.APIResponse[any] "Unauthorized"
// @Failure 500 {object} models.APIResponse[any] "Internal server error"
// @Router /hubs [post]
func (h *HubHandler) CreateHub(c *gin.Context) {
    // Implementation
}

// CreateHubRequest represents the hub creation request
type CreateHubRequest struct {
    Name        string   `json:"name" validate:"required,min=2,max=100" example:"Tech Innovations Hub"`
    Description string   `json:"description" validate:"required,min=10,max=1000" example:"A hub for technology enthusiasts"`
    Category    string   `json:"category" validate:"required" example:"Technology"`
    Tags        []string `json:"tags" validate:"max=10" example:"tech,innovation,startup"`
    IsPublic    bool     `json:"is_public" example:"true"`
} // @name CreateHubRequest
```

### List Hubs

```go
// @Summary List hubs
// @Description Get a paginated list of hubs
// @Tags Hubs
// @Produce json
// @Param page query int false "Page number" default(1) minimum(1)
// @Param limit query int false "Number of items per page" default(10) minimum(1) maximum(100)
// @Param category query string false "Filter by category" example("Technology")
// @Param search query string false "Search in hub names and descriptions" example("tech")
// @Param sort query string false "Sort order" Enums(created_at, name, popularity) default(created_at)
// @Param order query string false "Sort direction" Enums(asc, desc) default(desc)
// @Success 200 {object} models.APIResponse[models.PaginatedHubs] "Hubs retrieved successfully"
// @Failure 400 {object} models.APIResponse[any] "Invalid query parameters"
// @Failure 500 {object} models.APIResponse[any] "Internal server error"
// @Router /hubs [get]
func (h *HubHandler) ListHubs(c *gin.Context) {
    // Implementation
}

// PaginatedHubs represents paginated hub results
type PaginatedHubs struct {
    Hubs       []Hub      `json:"hubs"`
    Pagination Pagination `json:"pagination"`
} // @name PaginatedHubs

// Pagination represents pagination metadata
type Pagination struct {
    Page       int   `json:"page" example:"1"`
    Limit      int   `json:"limit" example:"10"`
    Total      int64 `json:"total" example:"100"`
    TotalPages int   `json:"total_pages" example:"10"`
    HasNext    bool  `json:"has_next" example:"true"`
    HasPrev    bool  `json:"has_prev" example:"false"`
} // @name Pagination
```

### Get Hub by ID

```go
// @Summary Get hub by ID
// @Description Get a specific hub by its ID
// @Tags Hubs
// @Produce json
// @Param id path string true "Hub ID" format(uuid)
// @Success 200 {object} models.APIResponse[models.HubDetail] "Hub retrieved successfully"
// @Failure 400 {object} models.APIResponse[any] "Invalid hub ID"
// @Failure 404 {object} models.APIResponse[any] "Hub not found"
// @Failure 500 {object} models.APIResponse[any] "Internal server error"
// @Router /hubs/{id} [get]
func (h *HubHandler) GetHub(c *gin.Context) {
    // Implementation
}
```

### Update Hub

```go
// @Summary Update hub
// @Description Update a hub owned by the authenticated user
// @Tags Hubs
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Hub ID" format(uuid)
// @Param request body UpdateHubRequest true "Hub update data"
// @Success 200 {object} models.APIResponse[models.Hub] "Hub updated successfully"
// @Failure 400 {object} models.APIResponse[any] "Invalid request data"
// @Failure 401 {object} models.APIResponse[any] "Unauthorized"
// @Failure 403 {object} models.APIResponse[any] "Forbidden - not hub owner"
// @Failure 404 {object} models.APIResponse[any] "Hub not found"
// @Failure 500 {object} models.APIResponse[any] "Internal server error"
// @Router /hubs/{id} [put]
func (h *HubHandler) UpdateHub(c *gin.Context) {
    // Implementation
}

// UpdateHubRequest represents the hub update request
type UpdateHubRequest struct {
    Name        *string  `json:"name,omitempty" validate:"omitempty,min=2,max=100" example:"Updated Hub Name"`
    Description *string  `json:"description,omitempty" validate:"omitempty,min=10,max=1000" example:"Updated description"`
    Category    *string  `json:"category,omitempty" example:"Technology"`
    Tags        []string `json:"tags,omitempty" validate:"max=10" example:"tech,innovation"`
    IsPublic    *bool    `json:"is_public,omitempty" example:"false"`
} // @name UpdateHubRequest
```

### Delete Hub

```go
// @Summary Delete hub
// @Description Delete a hub owned by the authenticated user
// @Tags Hubs
// @Security BearerAuth
// @Param id path string true "Hub ID" format(uuid)
// @Success 204 "Hub deleted successfully"
// @Failure 400 {object} models.APIResponse[any] "Invalid hub ID"
// @Failure 401 {object} models.APIResponse[any] "Unauthorized"
// @Failure 403 {object} models.APIResponse[any] "Forbidden - not hub owner"
// @Failure 404 {object} models.APIResponse[any] "Hub not found"
// @Failure 500 {object} models.APIResponse[any] "Internal server error"
// @Router /hubs/{id} [delete]
func (h *HubHandler) DeleteHub(c *gin.Context) {
    // Implementation
}
```

## Experience Management Endpoints

### Create Experience

```go
// @Summary Create a new experience
// @Description Create a new experience within a hub
// @Tags Experiences
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body CreateExperienceRequest true "Experience creation data"
// @Success 201 {object} models.APIResponse[models.Experience] "Experience created successfully"
// @Failure 400 {object} models.APIResponse[any] "Invalid request data"
// @Failure 401 {object} models.APIResponse[any] "Unauthorized"
// @Failure 403 {object} models.APIResponse[any] "Forbidden - not hub member"
// @Failure 404 {object} models.APIResponse[any] "Hub not found"
// @Failure 500 {object} models.APIResponse[any] "Internal server error"
// @Router /experiences [post]
func (h *ExperienceHandler) CreateExperience(c *gin.Context) {
    // Implementation
}

// CreateExperienceRequest represents the experience creation request
type CreateExperienceRequest struct {
    HubID       string    `json:"hub_id" validate:"required,uuid" example:"123e4567-e89b-12d3-a456-426614174000"`
    Title       string    `json:"title" validate:"required,min=2,max=200" example:"Introduction to Go Programming"`
    Description string    `json:"description" validate:"required,min=10,max=2000" example:"Learn the basics of Go programming"`
    Type        string    `json:"type" validate:"required,oneof=workshop seminar webinar course" example:"workshop"`
    Duration    int       `json:"duration" validate:"required,min=15,max=480" example:"120"` // minutes
    MaxSlots    int       `json:"max_slots" validate:"required,min=1,max=1000" example:"20"`
    Price       float64   `json:"price" validate:"min=0" example:"99.99"`
    Currency    string    `json:"currency" validate:"required,len=3" example:"USD"`
    StartTime   time.Time `json:"start_time" validate:"required" example:"2024-12-01T10:00:00Z"`
    EndTime     time.Time `json:"end_time" validate:"required" example:"2024-12-01T12:00:00Z"`
    Location    string    `json:"location,omitempty" example:"Online"`
    Tags        []string  `json:"tags" validate:"max=10" example:"programming,beginner,go"`
} // @name CreateExperienceRequest
```

## File Upload Endpoints

### Upload Avatar

```go
// @Summary Upload user avatar
// @Description Upload a new avatar image for the authenticated user
// @Tags Users
// @Security BearerAuth
// @Accept multipart/form-data
// @Produce json
// @Param avatar formData file true "Avatar image file (JPG, PNG, GIF, max 5MB)"
// @Success 200 {object} models.APIResponse[models.UploadResponse] "Avatar uploaded successfully"
// @Failure 400 {object} models.APIResponse[any] "Invalid file or file too large"
// @Failure 401 {object} models.APIResponse[any] "Unauthorized"
// @Failure 500 {object} models.APIResponse[any] "Internal server error"
// @Router /users/avatar [post]
func (h *UserHandler) UploadAvatar(c *gin.Context) {
    // Implementation
}

// UploadResponse represents file upload response
type UploadResponse struct {
    URL      string `json:"url" example:"https://storage.googleapis.com/bucket/avatar.jpg"`
    Filename string `json:"filename" example:"avatar.jpg"`
    Size     int64  `json:"size" example:"1024000"`
    MimeType string `json:"mime_type" example:"image/jpeg"`
} // @name UploadResponse
```

## Error Response Models

### Standard Error Response

```go
// APIResponse represents the standard API response format
type APIResponse[T any] struct {
    Success   bool      `json:"success" example:"true"`
    Data      T         `json:"data,omitempty"`
    Error     *AppError `json:"error,omitempty"`
    Metadata  *Metadata `json:"metadata,omitempty"`
} // @name APIResponse

// AppError represents application error details
type AppError struct {
    Code    string `json:"code" example:"USER_NOT_FOUND"`
    Message string `json:"message" example:"User not found"`
    Details any    `json:"details,omitempty"`
} // @name AppError

// Metadata represents response metadata
type Metadata struct {
    Timestamp string `json:"timestamp" example:"2024-01-01T12:00:00Z"`
    RequestID string `json:"request_id" example:"req-123456"`
    Version   string `json:"version" example:"1.0.0"`
} // @name Metadata
```

### Common Error Codes

```go
// Common error codes used across the API
const (
    // Authentication errors
    ErrCodeUnauthorized       = "UNAUTHORIZED"
    ErrCodeInvalidToken       = "INVALID_TOKEN"
    ErrCodeTokenExpired       = "TOKEN_EXPIRED"
    
    // Authorization errors
    ErrCodeForbidden          = "FORBIDDEN"
    ErrCodeInsufficientPerms  = "INSUFFICIENT_PERMISSIONS"
    
    // Validation errors
    ErrCodeValidationFailed   = "VALIDATION_FAILED"
    ErrCodeInvalidInput       = "INVALID_INPUT"
    ErrCodeMissingField       = "MISSING_FIELD"
    
    // Resource errors
    ErrCodeNotFound           = "NOT_FOUND"
    ErrCodeAlreadyExists      = "ALREADY_EXISTS"
    ErrCodeConflict           = "CONFLICT"
    
    // Server errors
    ErrCodeInternalError      = "INTERNAL_ERROR"
    ErrCodeServiceUnavailable = "SERVICE_UNAVAILABLE"
    ErrCodeTimeout            = "TIMEOUT"
    
    // Rate limiting
    ErrCodeRateLimited        = "RATE_LIMITED"
    ErrCodeQuotaExceeded      = "QUOTA_EXCEEDED"
)
```

## Health Check Endpoint

```go
// @Summary Health check
// @Description Check the health status of the API
// @Tags System
// @Produce json
// @Success 200 {object} models.APIResponse[models.HealthStatus] "Service is healthy"
// @Failure 503 {object} models.APIResponse[any] "Service is unhealthy"
// @Router /health [get]
func (h *HealthHandler) HealthCheck(c *gin.Context) {
    // Implementation
}

// HealthStatus represents the health status response
type HealthStatus struct {
    Status    string                 `json:"status" example:"healthy"`
    Timestamp string                 `json:"timestamp" example:"2024-01-01T12:00:00Z"`
    Version   string                 `json:"version" example:"1.0.0"`
    Services  map[string]ServiceInfo `json:"services"`
} // @name HealthStatus

// ServiceInfo represents individual service health
type ServiceInfo struct {
    Status      string `json:"status" example:"healthy"`
    LastChecked string `json:"last_checked" example:"2024-01-01T12:00:00Z"`
    ResponseTime string `json:"response_time,omitempty" example:"5ms"`
    Error       string `json:"error,omitempty"`
} // @name ServiceInfo
```

## Swagger Generation Commands

### Generate Documentation

```bash
# Install swag tool
go install github.com/swaggo/swag/cmd/swag@latest

# Generate Swagger documentation
swag init -g cmd/server/main.go

# Generate with specific output directory
swag init -g cmd/server/main.go -o ./docs

# Generate with specific instance name
swag init -g cmd/server/main.go --instanceName api

# Format Swagger comments
swag fmt
```

### Serve Documentation

```bash
# Access Swagger UI at: http://localhost:8080/swagger/index.html

# Download swagger.json: http://localhost:8080/swagger/doc.json
# Download swagger.yaml: http://localhost:8080/swagger/swagger.yaml
```

## Best Practices

### 1. Consistent Naming
- Use clear, descriptive operation IDs
- Group related endpoints with consistent tags
- Use consistent parameter and response naming

### 2. Comprehensive Documentation
- Include all possible response codes
- Document all parameters with examples
- Provide clear descriptions for complex operations

### 3. Security Documentation
- Always specify security requirements for protected endpoints
- Document authentication schemes clearly
- Include authorization requirements in descriptions

### 4. Request/Response Examples
- Provide realistic examples for all request bodies
- Include example responses for success and error cases
- Use proper data types and formats

### 5. Validation Documentation
- Document all validation rules in parameter descriptions
- Include format specifications (email, uuid, etc.)
- Specify minimum/maximum values and lengths

### 6. Error Handling
- Document all possible error responses
- Use consistent error response format
- Include error codes and messages

This comprehensive Swagger documentation ensures that the API is well-documented, easy to understand, and provides clear examples for all endpoints and data structures. 