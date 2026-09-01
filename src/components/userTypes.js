// src/constants/userTypes.js

export const USER_TYPES = [
  // ========== STUDENT (Standard) ==========
  { 
    key: 'student', 
    label: 'Student', 
    icon: 'fa-user-graduate', 
    loginType: 'matricule',  // Matricule + Password
    securityLevel: 'standard',
    mfaRequired: false,
    mfaOptional: true,
    description: 'Sign in with your matricule number',
    category: 'student',
    loginFlow: 'matricule_password'
  },
  
  // ========== PARENT (Standard) ==========
  { 
    key: 'parent', 
    label: 'Parent', 
    icon: 'fa-people-roof', 
    loginType: 'email',  // Email + Password (per IAM spec!)
    securityLevel: 'standard',
    mfaRequired: false,
    mfaOptional: true,  // Optional Email/SMS OTP
    description: 'Sign in with your registered email',
    category: 'parent',
    loginFlow: 'email_password',
    hasPhoneFallback: true  // For password recovery only
  },
  
  // ========== TEACHER (Medium) ==========
  { 
    key: 'teacher', 
    label: 'Teacher', 
    icon: 'fa-chalkboard-user', 
    loginType: 'email',
    securityLevel: 'medium',
    mfaRequired: false,
    mfaOptional: true,
    description: 'Sign in with your school email',
    category: 'academic_staff',
    loginFlow: 'email_password'
  },
  
  // ========== LIBRARIAN (High) ==========
  { 
    key: 'librarian', 
    label: 'Librarian', 
    icon: 'fa-book-open', 
    loginType: 'email',
    securityLevel: 'high',
    mfaRequired: true,  // MFA REQUIRED
    mfaOptional: false,
    description: 'Sign in with your school email',
    category: 'academic_staff',
    loginFlow: 'email_password_mfa'
  },
  
  // ========== DISCIPLINE MASTER (High) ==========
  { 
    key: 'discipline_master', 
    label: 'Discipline', 
    icon: 'fa-gavel', 
    loginType: 'email',
    securityLevel: 'high',
    mfaRequired: true,  // MFA REQUIRED
    mfaOptional: false,
    description: 'Sign in with your school email',
    category: 'academic_staff',
    loginFlow: 'email_password_mfa'
  },
  
  // ========== BURSAR (Critical) ==========
  { 
    key: 'bursar', 
    label: 'Bursar', 
    icon: 'fa-coins', 
    loginType: 'email',
    securityLevel: 'critical',
    mfaRequired: true,  // MFA REQUIRED
    mfaOptional: false,
    description: 'Sign in with your school email',
    category: 'administration',
    loginFlow: 'email_password_mfa'
  },
  
  // ========== VICE PRINCIPAL (Critical) ==========
  { 
    key: 'vice_principal', 
    label: 'Vice Principal', 
    icon: 'fa-user-tie', 
    loginType: 'email',
    securityLevel: 'critical',
    mfaRequired: true,  // MFA REQUIRED
    mfaOptional: false,
    description: 'Sign in with your school email',
    category: 'administration',
    loginFlow: 'email_password_mfa'
  },
  
  // ========== ADMIN (Critical) ==========
  { 
    key: 'admin', 
    label: 'Admin', 
    icon: 'fa-user-cog', 
    loginType: 'email',
    securityLevel: 'critical',
    mfaRequired: true,  // MFA REQUIRED
    mfaOptional: false,
    description: 'Sign in with your school email',
    category: 'administration',
    loginFlow: 'email_password_mfa'
  },
  
  // ========== SUPER ADMIN (Highest) ==========
  { 
    key: 'super_admin', 
    label: 'Super Admin', 
    icon: 'fa-crown', 
    loginType: 'email',
    securityLevel: 'highest',
    mfaRequired: true,  // MFA REQUIRED
    mfaOptional: false,
    mfaMethods: ['email', 'app'],  // OTP + Authenticator App
    description: 'Sign in with your school email',
    category: 'administration',
    loginFlow: 'email_password_mfa_app'
  },
];

// ========== CATEGORIES (Per IAM Section 15) ==========
export const USER_CATEGORIES = [
  { 
    key: 'student', 
    label: 'Students', 
    icon: 'fa-user-graduate',
    types: ['student']
  },
  { 
    key: 'parent', 
    label: 'Parents', 
    icon: 'fa-people-roof',
    types: ['parent']
  },
  { 
    key: 'academic_staff', 
    label: 'Academic Staff', 
    icon: 'fa-chalkboard-teacher',
    types: ['teacher', 'librarian', 'discipline_master']
  },
  { 
    key: 'administration', 
    label: 'Administration', 
    icon: 'fa-building',
    types: ['bursar', 'vice_principal', 'admin', 'super_admin']
  },
];

// ========== HELPERS ==========
export const getSecurityLevelColor = (level) => {
  const colors = {
    standard: '#22c55e',
    medium: '#eab308',
    high: '#f97316',
    critical: '#ef4444',
    highest: '#7c3aed',
  };
  return colors[level] || '#94a3b8';
};

export const getSecurityLevelLabel = (level) => {
  const labels = {
    standard: 'Standard',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
    highest: 'Highest',
  };
  return labels[level] || 'Unknown';
};

export const getMFAStatus = (userType) => {
  if (userType.mfaRequired) return 'required';
  if (userType.mfaOptional) return 'optional';
  return 'none';
};