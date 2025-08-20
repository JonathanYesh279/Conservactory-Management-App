# Login Credentials

## Admin User
- **Email**: admin@example.com
- **Password**: 123456

## Access URL
- Frontend: http://localhost:5173 (restarted with updated dashboard)
- Backend API: http://localhost:3001/api

## Important Notes
1. The backend uses DEFAULT_PASSWORD mode, which means all new users get password "123456" by default
2. After login, the authentication token is stored and used for subsequent API calls
3. The fixes implemented ensure proper token handling and authentication flow

## What was fixed:

### Authentication Issues (Fixed):
1. ✅ Authentication token storage - backend returns `accessToken` but frontend expected `data.accessToken`
2. ✅ School year context now waits for authentication before loading
3. ✅ Students and Teachers pages now load even without a selected school year
4. ✅ Token is properly stored and sent with API requests

### Dashboard Real Data Connection (Fixed):
1. ✅ **תלמידים פעילים** - Now shows actual count of active students from database
2. ✅ **חברי סגל** - Now shows actual count of active teachers from database  
3. ✅ **הרכבים פעילים** - Now shows actual count of active orchestras from database
4. ✅ **חזרות השבוע** - Now shows actual count of rehearsals in the next 7 days
5. ✅ **פעילות אחרונה** - Now shows real recent activities based on database data:
   - Recently added students
   - Upcoming rehearsals
   - Teacher assignments
6. ✅ **אירועים קרובים** - Now shows real upcoming rehearsals as events
7. ✅ **התקדמות חודשית** - Now shows real statistics instead of placeholder
8. ✅ **התפלגות תלמידים** - Now shows real distribution data

## Database Statistics Available:
- **Students**: 104 active students in the database
- **Teachers**: 114 active teachers in the database
- **Orchestras**: Shows actual count of active orchestras
- **Rehearsals**: Shows actual upcoming rehearsals from the database

All data is now pulled from the real MongoDB database and updates dynamically!