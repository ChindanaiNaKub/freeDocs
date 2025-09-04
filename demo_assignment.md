# Assignment: Update User Profile Component

## Instructions

Update the existing UserProfile component to include email validation and error handling.

## Code Changes Required

### Original Component Structure

```javascript
function UserProfile({ user }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add validation
    updateUser({ name, email });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <input 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <button type="submit">Update Profile</button>
    </form>
  );
}
```

### Required Updates

Make the following changes to add email validation:

```javascript
function UserProfile({ user }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
+ const [errors, setErrors] = useState({});
+ const [isSubmitting, setIsSubmitting] = useState(false);

+ const validateEmail = (email) => {
+   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
+   return emailRegex.test(email);
+ };

+ const validateForm = () => {
+   const newErrors = {};
+   
+   if (!name.trim()) {
+     newErrors.name = 'Name is required';
+   }
+   
+   if (!email.trim()) {
+     newErrors.email = 'Email is required';
+   } else if (!validateEmail(email)) {
+     newErrors.email = 'Please enter a valid email address';
+   }
+   
+   setErrors(newErrors);
+   return Object.keys(newErrors).length === 0;
+ };

- const handleSubmit = (e) => {
+ const handleSubmit = async (e) => {
    e.preventDefault();
-   // TODO: Add validation
-   updateUser({ name, email });
+   
+   if (!validateForm()) {
+     return;
+   }
+   
+   setIsSubmitting(true);
+   try {
+     await updateUser({ name, email });
+     setErrors({});
+   } catch (error) {
+     setErrors({ submit: 'Failed to update profile. Please try again.' });
+   } finally {
+     setIsSubmitting(false);
+   }
  };

  return (
    <form onSubmit={handleSubmit}>
+     {errors.submit && (
+       <div className="error-message">{errors.submit}</div>
+     )}
      <input 
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
+       className={errors.name ? 'error' : ''}
      />
+     {errors.name && <span className="field-error">{errors.name}</span>}
      
      <input 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
+       className={errors.email ? 'error' : ''}
      />
+     {errors.email && <span className="field-error">{errors.email}</span>}
      
-     <button type="submit">Update Profile</button>
+     <button type="submit" disabled={isSubmitting}>
+       {isSubmitting ? 'Updating...' : 'Update Profile'}
+     </button>
    </form>
  );
}
```

### Styling Updates

Add these CSS classes for error styling:

```css
.error-message {
  background-color: #fee;
  color: #c00;
  padding: 0.5rem;
  border: 1px solid #fcc;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.field-error {
  color: #c00;
  font-size: 0.875rem;
  display: block;
  margin-top: 0.25rem;
}

.error {
  border-color: #c00;
}

+ button:disabled {
+   opacity: 0.6;
+   cursor: not-allowed;
+ }
```

## Testing Requirements

1. Test that validation prevents submission with empty fields
2. Test that invalid email addresses are rejected
3. Test that loading state is shown during submission
4. Test that error messages are displayed appropriately

## Submission

Copy the completed code (without the diff markers) and submit it along with your test cases.
