# Database Patterns with GORM

## Overview
This document contains database patterns and best practices for GORM with PostgreSQL in the Mereka Golang backend.

## Model Definition Patterns

### Base Model Pattern
```go
type BaseModel struct {
    ID        string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
    CreatedAt time.Time      `json:"created_at"`
    UpdatedAt time.Time      `json:"updated_at"`
    DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
```

### User Model Example
```go
type User struct {
    BaseModel
    Email       string `gorm:"uniqueIndex;not null" json:"email"`
    FirebaseUID string `gorm:"uniqueIndex;not null;column:firebase_uid" json:"firebase_uid"`
    Name        string `gorm:"not null" json:"name"`
    PhotoURL    string `gorm:"column:photo_url" json:"photo_url,omitempty"`
    Verified    bool   `gorm:"default:false" json:"verified"`
    Role        string `gorm:"default:'user'" json:"role"`
    
    // Relationships
    Profile UserProfile `gorm:"foreignKey:UserID" json:"profile,omitempty"`
    Hubs    []Hub       `gorm:"many2many:user_hubs;" json:"hubs,omitempty"`
}

func (User) TableName() string {
    return "users"
}
```

### Complex Model with Relationships
```go
type Hub struct {
    BaseModel
    Name        string `gorm:"not null" json:"name"`
    Description string `json:"description"`
    OwnerID     string `gorm:"not null;type:uuid" json:"owner_id"`
    IsActive    bool   `gorm:"default:true" json:"is_active"`
    
    // Relationships
    Owner       User         `gorm:"foreignKey:OwnerID" json:"owner"`
    Members     []User       `gorm:"many2many:user_hubs;" json:"members,omitempty"`
    Experiences []Experience `gorm:"foreignKey:HubID" json:"experiences,omitempty"`
    
    // Metadata
    Settings HubSettings `gorm:"embedded" json:"settings"`
}

type HubSettings struct {
    AllowPublicJoin bool   `gorm:"column:allow_public_join;default:false" json:"allow_public_join"`
    MaxMembers      int    `gorm:"column:max_members;default:100" json:"max_members"`
    Category        string `gorm:"column:category" json:"category"`
}
```

## Repository Pattern Implementation

### Base Repository Interface
```go
type BaseRepository[T any] interface {
    Create(ctx context.Context, entity *T) error
    GetByID(ctx context.Context, id string) (*T, error)
    Update(ctx context.Context, entity *T) error
    Delete(ctx context.Context, id string) error
    List(ctx context.Context, filter ListFilter) ([]*T, error)
    Count(ctx context.Context, filter ListFilter) (int64, error)
}

type ListFilter struct {
    Limit  int
    Offset int
    Sort   string
    Order  string
    Search string
}
```

### Concrete Repository Implementation
```go
type userRepository struct {
    db     *gorm.DB
    logger *zap.Logger
}

func NewUserRepository(db *gorm.DB, logger *zap.Logger) UserRepository {
    return &userRepository{
        db:     db,
        logger: logger,
    }
}

func (r *userRepository) Create(ctx context.Context, user *models.User) error {
    if err := r.db.WithContext(ctx).Create(user).Error; err != nil {
        r.logger.Error("failed to create user", 
            zap.Error(err), 
            zap.String("email", user.Email))
        return fmt.Errorf("failed to create user: %w", err)
    }
    
    r.logger.Info("user created successfully", 
        zap.String("user_id", user.ID),
        zap.String("email", user.Email))
    
    return nil
}

func (r *userRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
    var user models.User
    
    err := r.db.WithContext(ctx).
        Preload("Profile").
        Preload("Hubs").
        First(&user, "id = ?", id).Error
        
    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, fmt.Errorf("user not found: %w", err)
        }
        r.logger.Error("failed to get user", zap.Error(err), zap.String("id", id))
        return nil, fmt.Errorf("failed to get user: %w", err)
    }
    
    return &user, nil
}

func (r *userRepository) GetByFirebaseUID(ctx context.Context, firebaseUID string) (*models.User, error) {
    var user models.User
    
    err := r.db.WithContext(ctx).
        Preload("Profile").
        First(&user, "firebase_uid = ?", firebaseUID).Error
        
    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, fmt.Errorf("user not found: %w", err)
        }
        return nil, fmt.Errorf("failed to get user by firebase UID: %w", err)
    }
    
    return &user, nil
}

func (r *userRepository) Update(ctx context.Context, user *models.User) error {
    result := r.db.WithContext(ctx).Save(user)
    if result.Error != nil {
        r.logger.Error("failed to update user", 
            zap.Error(result.Error), 
            zap.String("user_id", user.ID))
        return fmt.Errorf("failed to update user: %w", result.Error)
    }
    
    if result.RowsAffected == 0 {
        return fmt.Errorf("user not found for update")
    }
    
    return nil
}
```

## Transaction Patterns

### Service-Level Transactions
```go
func (s *UserService) RegisterUser(ctx context.Context, req RegisterRequest) (*User, error) {
    var user *User
    var profile *UserProfile
    
    err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
        // Create user
        user = &User{
            Email:       req.Email,
            FirebaseUID: req.FirebaseUID,
            Name:        req.Name,
            Verified:    req.Verified,
        }
        
        if err := tx.Create(user).Error; err != nil {
            return fmt.Errorf("failed to create user: %w", err)
        }
        
        // Create user profile
        profile = &UserProfile{
            UserID:      user.ID,
            Bio:         req.Bio,
            Skills:      req.Skills,
            Interests:   req.Interests,
        }
        
        if err := tx.Create(profile).Error; err != nil {
            return fmt.Errorf("failed to create user profile: %w", err)
        }
        
        // Send welcome email (external service - if this fails, transaction rolls back)
        if err := s.emailService.SendWelcomeEmail(ctx, user.Email, user.Name); err != nil {
            return fmt.Errorf("failed to send welcome email: %w", err)
        }
        
        return nil
    })
    
    if err != nil {
        s.logger.Error("user registration transaction failed", 
            zap.Error(err), 
            zap.String("email", req.Email))
        return nil, err
    }
    
    // Load the complete user with profile
    user.Profile = *profile
    
    return user, nil
}
```

### Repository-Level Transactions
```go
func (r *hubRepository) TransferOwnership(ctx context.Context, hubID, newOwnerID string) error {
    return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
        // Update hub owner
        if err := tx.Model(&Hub{}).
            Where("id = ?", hubID).
            Update("owner_id", newOwnerID).Error; err != nil {
            return fmt.Errorf("failed to update hub owner: %w", err)
        }
        
        // Add new owner to members if not already a member
        var count int64
        tx.Model(&UserHub{}).
            Where("user_id = ? AND hub_id = ?", newOwnerID, hubID).
            Count(&count)
            
        if count == 0 {
            userHub := &UserHub{
                UserID: newOwnerID,
                HubID:  hubID,
                Role:   "owner",
            }
            if err := tx.Create(userHub).Error; err != nil {
                return fmt.Errorf("failed to add new owner as member: %w", err)
            }
        } else {
            // Update existing membership role
            if err := tx.Model(&UserHub{}).
                Where("user_id = ? AND hub_id = ?", newOwnerID, hubID).
                Update("role", "owner").Error; err != nil {
                return fmt.Errorf("failed to update member role: %w", err)
            }
        }
        
        return nil
    })
}
```

## Query Patterns

### Complex Queries with Joins
```go
func (r *experienceRepository) GetExperiencesWithDetails(ctx context.Context, filter ExperienceFilter) ([]*Experience, error) {
    query := r.db.WithContext(ctx).
        Model(&Experience{}).
        Preload("Hub").
        Preload("Hub.Owner").
        Preload("Instructor").
        Preload("Bookings").
        Preload("Reviews")
    
    // Apply filters
    if filter.HubID != "" {
        query = query.Where("hub_id = ?", filter.HubID)
    }
    
    if filter.Category != "" {
        query = query.Where("category = ?", filter.Category)
    }
    
    if filter.StartDate != nil {
        query = query.Where("start_time >= ?", filter.StartDate)
    }
    
    if filter.EndDate != nil {
        query = query.Where("end_time <= ?", filter.EndDate)
    }
    
    if filter.Search != "" {
        searchTerm := "%" + filter.Search + "%"
        query = query.Where("title ILIKE ? OR description ILIKE ?", searchTerm, searchTerm)
    }
    
    // Apply sorting
    if filter.SortBy != "" {
        order := "ASC"
        if filter.SortOrder == "desc" {
            order = "DESC"
        }
        query = query.Order(fmt.Sprintf("%s %s", filter.SortBy, order))
    } else {
        query = query.Order("created_at DESC")
    }
    
    // Apply pagination
    if filter.Limit > 0 {
        query = query.Limit(filter.Limit)
    }
    
    if filter.Offset > 0 {
        query = query.Offset(filter.Offset)
    }
    
    var experiences []*Experience
    if err := query.Find(&experiences).Error; err != nil {
        return nil, fmt.Errorf("failed to get experiences: %w", err)
    }
    
    return experiences, nil
}
```

### Aggregation Queries
```go
func (r *userRepository) GetUserStats(ctx context.Context, userID string) (*UserStats, error) {
    var stats UserStats
    
    // Get hub count
    if err := r.db.WithContext(ctx).
        Model(&UserHub{}).
        Where("user_id = ?", userID).
        Count(&stats.HubCount).Error; err != nil {
        return nil, fmt.Errorf("failed to count user hubs: %w", err)
    }
    
    // Get experience count as instructor
    if err := r.db.WithContext(ctx).
        Model(&Experience{}).
        Where("instructor_id = ?", userID).
        Count(&stats.ExperiencesAsInstructor).Error; err != nil {
        return nil, fmt.Errorf("failed to count experiences as instructor: %w", err)
    }
    
    // Get booking count as participant
    if err := r.db.WithContext(ctx).
        Model(&Booking{}).
        Where("user_id = ?", userID).
        Count(&stats.BookingsAsParticipant).Error; err != nil {
        return nil, fmt.Errorf("failed to count bookings as participant: %w", err)
    }
    
    // Get average rating as instructor
    var avgRating sql.NullFloat64
    if err := r.db.WithContext(ctx).
        Model(&Review{}).
        Select("AVG(rating)").
        Joins("JOIN experiences ON reviews.experience_id = experiences.id").
        Where("experiences.instructor_id = ?", userID).
        Scan(&avgRating).Error; err != nil {
        return nil, fmt.Errorf("failed to calculate average rating: %w", err)
    }
    
    if avgRating.Valid {
        stats.AverageRating = avgRating.Float64
    }
    
    return &stats, nil
}
```

## Migration Patterns

### Auto Migration
```go
func AutoMigrate(db *gorm.DB) error {
    return db.AutoMigrate(
        &User{},
        &UserProfile{},
        &Hub{},
        &Experience{},
        &Booking{},
        &Review{},
        &UserHub{},
    )
}
```

### Custom Migration with Raw SQL
```go
func CreateIndexes(db *gorm.DB) error {
    migrations := []string{
        `CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);`,
        `CREATE INDEX IF NOT EXISTS idx_experiences_hub_id ON experiences(hub_id);`,
        `CREATE INDEX IF NOT EXISTS idx_experiences_start_time ON experiences(start_time);`,
        `CREATE INDEX IF NOT EXISTS idx_bookings_user_experience ON bookings(user_id, experience_id);`,
        `CREATE INDEX IF NOT EXISTS idx_reviews_experience_id ON reviews(experience_id);`,
    }
    
    for _, migration := range migrations {
        if err := db.Exec(migration).Error; err != nil {
            return fmt.Errorf("failed to execute migration: %s, error: %w", migration, err)
        }
    }
    
    return nil
}
```

## Performance Optimization Patterns

### Connection Pool Configuration
```go
func ConfigureConnectionPool(db *gorm.DB) error {
    sqlDB, err := db.DB()
    if err != nil {
        return err
    }
    
    // SetMaxIdleConns sets the maximum number of connections in the idle connection pool.
    sqlDB.SetMaxIdleConns(10)
    
    // SetMaxOpenConns sets the maximum number of open connections to the database.
    sqlDB.SetMaxOpenConns(100)
    
    // SetConnMaxLifetime sets the maximum amount of time a connection may be reused.
    sqlDB.SetConnMaxLifetime(time.Hour)
    
    return nil
}
```

### Query Optimization
```go
// Use Select to limit columns
func (r *userRepository) GetUserBasicInfo(ctx context.Context, id string) (*UserBasicInfo, error) {
    var user UserBasicInfo
    
    err := r.db.WithContext(ctx).
        Model(&User{}).
        Select("id, name, email, photo_url").
        Where("id = ?", id).
        First(&user).Error
        
    if err != nil {
        return nil, fmt.Errorf("failed to get user basic info: %w", err)
    }
    
    return &user, nil
}

// Use Joins instead of multiple queries
func (r *experienceRepository) GetExperienceWithHub(ctx context.Context, id string) (*Experience, error) {
    var experience Experience
    
    err := r.db.WithContext(ctx).
        Joins("Hub").
        Joins("Hub.Owner").
        Where("experiences.id = ?", id).
        First(&experience).Error
        
    if err != nil {
        return nil, fmt.Errorf("failed to get experience with hub: %w", err)
    }
    
    return &experience, nil
}
```

### Bulk Operations
```go
func (r *userRepository) CreateUsers(ctx context.Context, users []*User) error {
    if len(users) == 0 {
        return nil
    }
    
    // Use CreateInBatches for large datasets
    batchSize := 100
    if err := r.db.WithContext(ctx).CreateInBatches(users, batchSize).Error; err != nil {
        return fmt.Errorf("failed to create users in batches: %w", err)
    }
    
    return nil
}

func (r *userRepository) UpdateUsersStatus(ctx context.Context, userIDs []string, status string) error {
    if len(userIDs) == 0 {
        return nil
    }
    
    result := r.db.WithContext(ctx).
        Model(&User{}).
        Where("id IN ?", userIDs).
        Update("status", status)
        
    if result.Error != nil {
        return fmt.Errorf("failed to update users status: %w", result.Error)
    }
    
    r.logger.Info("updated users status", 
        zap.Int("count", int(result.RowsAffected)),
        zap.String("status", status))
    
    return nil
}
```

## Error Handling Patterns

### Custom Repository Errors
```go
var (
    ErrUserNotFound     = errors.New("user not found")
    ErrUserExists       = errors.New("user already exists")
    ErrInvalidUserData  = errors.New("invalid user data")
)

func (r *userRepository) handleDBError(err error, operation string) error {
    if err == nil {
        return nil
    }
    
    switch {
    case errors.Is(err, gorm.ErrRecordNotFound):
        return ErrUserNotFound
    case errors.Is(err, gorm.ErrDuplicatedKey):
        return ErrUserExists
    default:
        r.logger.Error("database operation failed", 
            zap.Error(err), 
            zap.String("operation", operation))
        return fmt.Errorf("database operation failed: %w", err)
    }
}
```

## Best Practices

1. **Use transactions for multi-table operations**
2. **Always use context for cancellation and timeouts**
3. **Implement proper error handling and logging**
4. **Use preloading efficiently to avoid N+1 queries**
5. **Create indexes for frequently queried columns**
6. **Use pagination for large result sets**
7. **Validate data before database operations**
8. **Use connection pooling appropriately**
9. **Monitor query performance**
10. **Keep migrations version controlled**

## Common Gotchas

1. **N+1 Query Problem**: Use `Preload` or `Joins` appropriately
2. **Missing Foreign Key Constraints**: Define relationships correctly
3. **Timezone Issues**: Always use UTC in the database
4. **Soft Delete Confusion**: Remember that soft-deleted records are filtered by default
5. **Transaction Rollback**: External service calls inside transactions can cause issues
6. **Connection Leaks**: Always use context and proper connection management 