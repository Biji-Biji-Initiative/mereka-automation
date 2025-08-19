# Firebase to Golang Migration Guide

## 🎯 Migration Strategy Overview

This document outlines the systematic migration from Firebase backend to Golang backend, while retaining Firebase Authentication as the primary authentication service.

## 🏗️ Architecture Overview

### Current State (Firebase)
- Firebase Auth for authentication
- Firestore for data storage
- Firebase Cloud Functions for business logic
- Firebase Storage for file management

### Target State (Hybrid)
- **Firebase Auth** - Continue using for authentication (no change)
- **PostgreSQL** - Primary data storage (replaces Firestore)
- **Golang + Gin** - Business logic and API (replaces Cloud Functions)
- **Firebase Storage** - Continue using for file management (optional migration)

### Migration Principles
1. **Keep Firebase Auth** - Zero disruption to authentication flows
2. **Gradual Data Migration** - Move data collections one by one
3. **API Compatibility** - Maintain existing API contracts during transition
4. **Zero Downtime** - Ensure continuous service availability

## 🔄 Data Migration Strategy

### Phase 1: Core Entities
Migrate foundational data structures first:

#### 1.1 User Profiles
```sql
-- PostgreSQL schema for users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL, -- Link to Firebase Auth
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    profile_image_url TEXT,
    birth_date DATE,
    phone_number VARCHAR(20),
    bio TEXT,
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    
    -- Profile completion tracking
    profile_completion_percentage INTEGER DEFAULT 0,
    
    -- Preferences
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    
    -- Indexes
    INDEX idx_firebase_uid (firebase_uid),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
```

#### 1.2 Hubs
```sql
CREATE TABLE hubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    cover_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    member_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Search and discovery
    tags TEXT[], -- PostgreSQL array for tags
    location VARCHAR(255),
    is_public BOOLEAN DEFAULT true,
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    engagement_score DECIMAL(10,2) DEFAULT 0.0,
    
    INDEX idx_owner_id (owner_id),
    INDEX idx_category (category),
    INDEX idx_is_active (is_active),
    INDEX idx_is_featured (is_featured),
    INDEX idx_created_at (created_at)
);
```

#### 1.3 Experiences
```sql
CREATE TABLE experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_id UUID REFERENCES hubs(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    
    -- Scheduling
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    timezone VARCHAR(50),
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern JSONB, -- Store complex recurrence rules
    
    -- Capacity and booking
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    waiting_list_count INTEGER DEFAULT 0,
    
    -- Pricing
    price_amount DECIMAL(10,2) DEFAULT 0.0,
    currency VARCHAR(3) DEFAULT 'USD',
    is_free BOOLEAN DEFAULT true,
    
    -- Media and content
    cover_image_url TEXT,
    video_url TEXT,
    materials JSONB, -- Links to materials, documents
    
    -- Status and visibility
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    is_featured BOOLEAN DEFAULT false,
    
    -- Location (virtual/physical)
    location_type VARCHAR(20) DEFAULT 'virtual' CHECK (location_type IN ('virtual', 'physical', 'hybrid')),
    location_details JSONB,
    meeting_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_hub_id (hub_id),
    INDEX idx_creator_id (creator_id),
    INDEX idx_start_time (start_time),
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_is_featured (is_featured)
);
```

### Phase 2: Relationships and Interactions

#### 2.1 Hub Memberships
```sql
CREATE TABLE hub_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_id UUID REFERENCES hubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
    
    UNIQUE(hub_id, user_id),
    INDEX idx_hub_id (hub_id),
    INDEX idx_user_id (user_id),
    INDEX idx_role (role),
    INDEX idx_status (status)
);
```

#### 2.2 Experience Bookings
```sql
CREATE TABLE experience_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    booking_status VARCHAR(20) DEFAULT 'confirmed' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    
    -- Payment information
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    amount_paid DECIMAL(10,2) DEFAULT 0.0,
    stripe_payment_intent_id VARCHAR(255),
    
    -- Booking details
    booking_notes TEXT,
    special_requirements TEXT,
    
    -- Timestamps
    booked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(experience_id, user_id),
    INDEX idx_experience_id (experience_id),
    INDEX idx_user_id (user_id),
    INDEX idx_booking_status (booking_status),
    INDEX idx_payment_status (payment_status)
);
```

### Phase 3: Advanced Features

#### 3.1 Reviews and Ratings
```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
    
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    
    -- Review metadata
    is_public BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_reviewer_id (reviewer_id),
    INDEX idx_reviewee_id (reviewee_id),
    INDEX idx_experience_id (experience_id),
    INDEX idx_rating (rating),
    INDEX idx_created_at (created_at)
);
```

#### 3.2 Chat and Messaging
```sql
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'experience', 'hub')),
    name VARCHAR(255),
    description TEXT,
    
    -- Associated entities
    hub_id UUID REFERENCES hubs(id) ON DELETE CASCADE,
    experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
    
    -- Room settings
    is_active BOOLEAN DEFAULT true,
    max_members INTEGER,
    current_members INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_type (type),
    INDEX idx_hub_id (hub_id),
    INDEX idx_experience_id (experience_id),
    INDEX idx_last_message_at (last_message_at)
);

CREATE TABLE chat_room_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_muted BOOLEAN DEFAULT false,
    
    UNIQUE(room_id, user_id),
    INDEX idx_room_id (room_id),
    INDEX idx_user_id (user_id)
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Message content
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    
    -- File attachments
    attachments JSONB,
    
    -- Message metadata
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    reply_to_id UUID REFERENCES chat_messages(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_room_id (room_id),
    INDEX idx_sender_id (sender_id),
    INDEX idx_created_at (created_at),
    INDEX idx_reply_to_id (reply_to_id)
);
```

## 🔧 API Migration Strategy

### Authentication Integration
Keep Firebase Auth but add PostgreSQL user management:

```go
// Firebase token verification remains the same
func (h *AuthHandler) VerifyFirebaseToken(c *gin.Context) {
    tokenString := extractTokenFromHeader(c)
    
    // Verify with Firebase (existing logic)
    token, err := h.firebaseAuth.VerifyIDToken(c.Request.Context(), tokenString)
    if err != nil {
        c.JSON(401, gin.H{"error": "Invalid token"})
        return
    }
    
    // Get or create user in PostgreSQL
    user, err := h.userService.GetOrCreateUser(c.Request.Context(), token.UID, token.Claims)
    if err != nil {
        c.JSON(500, gin.H{"error": "Failed to get user"})
        return
    }
    
    // Store user info in context for subsequent handlers
    c.Set("user_id", user.ID)
    c.Set("firebase_uid", token.UID)
    c.Next()
}
```

### API Endpoint Migration
Maintain existing API contracts while switching backend:

```go
// Before (Firebase Functions style)
// POST /api/v1/hubs
// Response: { success: boolean, data: Hub, error?: string }

// After (Golang with same contract)
func (h *HubHandler) CreateHub(c *gin.Context) {
    var req CreateHubRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, APIResponse[any]{
            Success: false,
            Error: &APIError{
                Code:    "INVALID_REQUEST",
                Message: "Invalid request data",
                Details: err.Error(),
            },
        })
        return
    }
    
    userID := c.GetString("user_id")
    hub, err := h.hubService.CreateHub(c.Request.Context(), userID, &req)
    if err != nil {
        handleServiceError(c, err)
        return
    }
    
    c.JSON(201, APIResponse[*Hub]{
        Success: true,
        Data:    hub,
        Metadata: &APIMetadata{
            Timestamp: time.Now().Unix(),
            RequestID: c.GetString("request_id"),
            Version:   "2.0",
        },
    })
}
```

## 📊 Data Migration Scripts

### Migration Tools
Create data migration utilities:

```go
// tools/migrate/firestore_to_postgres.go
package main

import (
    "context"
    "encoding/json"
    "log"
    
    "cloud.google.com/go/firestore"
    "github.com/mereka/backend-golang/internal/config"
    "github.com/mereka/backend-golang/internal/repositories"
    "gorm.io/gorm"
)

type DataMigrator struct {
    firestoreClient *firestore.Client
    postgresDB      *gorm.DB
    userRepo        repositories.UserRepository
    hubRepo         repositories.HubRepository
}

func (m *DataMigrator) MigrateUsers(ctx context.Context) error {
    // Fetch users from Firestore
    iter := m.firestoreClient.Collection("users").Documents(ctx)
    
    var migratedCount, errorCount int
    
    for {
        doc, err := iter.Next()
        if err == iterator.Done {
            break
        }
        if err != nil {
            log.Printf("Error reading document: %v", err)
            errorCount++
            continue
        }
        
        // Convert Firestore document to PostgreSQL model
        var firestoreUser FirestoreUser
        if err := doc.DataTo(&firestoreUser); err != nil {
            log.Printf("Error parsing user document %s: %v", doc.Ref.ID, err)
            errorCount++
            continue
        }
        
        postgresUser := convertFirestoreUserToPostgres(firestoreUser, doc.Ref.ID)
        
        // Insert into PostgreSQL
        if err := m.userRepo.Create(ctx, postgresUser); err != nil {
            log.Printf("Error creating user %s: %v", doc.Ref.ID, err)
            errorCount++
            continue
        }
        
        migratedCount++
        if migratedCount%100 == 0 {
            log.Printf("Migrated %d users", migratedCount)
        }
    }
    
    log.Printf("Migration complete: %d users migrated, %d errors", migratedCount, errorCount)
    return nil
}

func convertFirestoreUserToPostgres(fsUser FirestoreUser, firebaseUID string) *models.User {
    return &models.User{
        FirebaseUID:               firebaseUID,
        Email:                     fsUser.Email,
        FullName:                  fsUser.FullName,
        ProfileImageURL:           fsUser.ProfileImageURL,
        BirthDate:                 fsUser.BirthDate,
        PhoneNumber:               fsUser.PhoneNumber,
        Bio:                       fsUser.Bio,
        Location:                  fsUser.Location,
        NotificationsEnabled:      fsUser.NotificationsEnabled,
        EmailNotifications:        fsUser.EmailNotifications,
        PushNotifications:         fsUser.PushNotifications,
        ProfileCompletionPercentage: fsUser.ProfileCompletionPercentage,
        // Map other fields as needed
    }
}
```

## 🚀 Deployment Strategy

### Phase 1: Parallel Systems
1. Deploy Golang backend alongside Firebase
2. Implement feature flags for gradual rollout
3. Run both systems in parallel during migration

### Phase 2: Gradual Migration
1. Start with read-only operations from PostgreSQL
2. Gradually move write operations
3. Keep Firebase as backup during transition

### Phase 3: Full Cutover
1. Switch all traffic to Golang backend
2. Keep Firebase in read-only mode for rollback
3. Decommission Firebase after stability period

## 🔍 Monitoring and Validation

### Data Integrity Checks
```go
func ValidateDataMigration(ctx context.Context) error {
    // Compare record counts
    firestoreCount := getFirestoreUserCount(ctx)
    postgresCount := getPostgresUserCount(ctx)
    
    if firestoreCount != postgresCount {
        return fmt.Errorf("user count mismatch: Firestore=%d, Postgres=%d", 
            firestoreCount, postgresCount)
    }
    
    // Sample validation of specific records
    return validateSampleRecords(ctx)
}
```

### Performance Monitoring
- Track API response times before and after migration
- Monitor database query performance
- Set up alerts for error rates and latency spikes

## 📚 Documentation Updates

### API Documentation
- Update Swagger documentation for new endpoints
- Maintain backward compatibility documentation
- Create migration guides for frontend developers

### Database Documentation
- Document new PostgreSQL schema
- Create entity relationship diagrams
- Document data migration procedures

## 🔐 Security Considerations

### Firebase Auth Integration
- Ensure Firebase token verification remains secure
- Implement proper session management with PostgreSQL
- Maintain audit trails for authentication events

### Data Protection
- Encrypt sensitive data in PostgreSQL
- Implement proper access controls
- Ensure GDPR compliance in new system

## ✅ Migration Checklist

### Pre-Migration
- [ ] Set up PostgreSQL database
- [ ] Create comprehensive backup of Firestore data
- [ ] Set up monitoring and alerting
- [ ] Prepare rollback procedures

### During Migration
- [ ] Migrate users table
- [ ] Migrate hubs table
- [ ] Migrate experiences table
- [ ] Migrate relationships and bookings
- [ ] Validate data integrity
- [ ] Test all API endpoints

### Post-Migration
- [ ] Monitor system performance
- [ ] Validate business logic
- [ ] Perform user acceptance testing
- [ ] Update documentation
- [ ] Train support team on new system

This migration strategy ensures a smooth transition from Firebase to Golang while maintaining service availability and data integrity. 