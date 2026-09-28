# LABFLOW — PHASE 5A
# GITHUB INTEGRATION — PRE-IMPLEMENTATION RESEARCH & AUDIT

## A. Current LabFlow Auth Architecture
The current authentication system operates completely independently of GitHub.
- **Backend (FastAPI)**: Authentication is driven by Google OAuth using `authlib`. The OAuth callback (`/google/callback`) retrieves the user's Google ID, email, and name.
- **Database (MongoDB)**: The retrieved Google details are matched against the `students` (or `faculty`) collection. If no match exists, a new student record is created.
- **Tokens (JWT)**: After successful Google login, the backend generates a standard JWT (JSON Web Token) encoding the user's ID, role, and basic profile info.
- **Frontend (React)**: The JWT is passed to the frontend via URL parameters and stored in `localStorage` as `labflow_token`. The `AuthContext` decodes this token to manage the global session state.

## B. Current Submission Architecture
The existing submission system uses MongoDB to store raw student code and evaluation state without any version control integration.
- **Storage**: Code is stored as a direct string field (`submitted_code`) inside a flattened document in the MongoDB `submissions` collection.
- **Process**: The `create_or_update_submission` service function receives the payload, constructs a comprehensive `sub_doc` dictionary (including `submission_id`, `course_id`, `exercise_id`, `status`), updates a server-side in-memory cache, and upserts the document into MongoDB.
- **Independence**: Submissions currently have no ties to external repositories. The design is robust and handles repeated submissions by simply overwriting the `submitted_code` field and updating the timestamp.

## C. GitHub Authentication Options
To allow students to link their GitHub accounts and save code, there are two primary integration methods provided by GitHub:
1. **GitHub OAuth App**:
   - The application acts on behalf of the user.
   - The user authorizes the app, granting it specific permission scopes (e.g., `repo`).
   - The app receives a standard OAuth access token that does not expire (unless manually revoked).
   - The app makes requests to the GitHub API using this token.
2. **GitHub App**:
   - The application can act on its own behalf or on behalf of a user via user-to-server tokens.
   - Requires users to "install" the app onto their account and select specific repositories to grant access to.
   - Uses short-lived tokens that require continuous rotation and cryptographic signing (JWT) to request new installation tokens.

## D. Recommended GitHub Authentication Approach and Why
**Recommendation**: **GitHub OAuth App**
**Why**: 
For the scope of this MCA demonstration, a GitHub OAuth App is significantly simpler to implement and provides a much smoother user experience. 
- **Implementation Complexity**: It seamlessly matches the existing `authlib` Google OAuth setup. Implementing a GitHub App would require complex token rotation logic, webhook handling, and managing temporary installation IDs.
- **User Experience**: The user simply clicks "Connect", clicks "Authorize" on GitHub, and they are done. With a GitHub App, the user has to navigate a more complex installation UI to grant repository access.
- **Use Case**: Students will be generating a dedicated repository (e.g., `labflow-submissions`) specifically for this platform. While OAuth Apps request broad access (the `repo` scope grants access to all repositories), this trade-off is standard and acceptable for an educational demo compared to the massive engineering overhead of a GitHub App.

## E. Required GitHub Permissions/Scopes
For the OAuth App, the following scope is required:
- `repo`: Grants full read and write access to the user's public and private repositories. This is strictly necessary because the application must be able to create new repositories on the user's behalf and create/update commits containing their submitted code.

## F. Token Storage Recommendation
The GitHub access token must be handled with extreme care:
- **Rule 1**: NEVER return the token to the React frontend or expose it in the `/me` profile endpoint.
- **Rule 2**: NEVER store the token in `localStorage`.
- **Recommendation**: Store the token in the MongoDB `students` document alongside the existing `github_username` field.
- **Security Mechanism**: The token **MUST** be symmetrically encrypted before being saved to MongoDB. Use a library like `cryptography` (specifically `Fernet`) with an encryption key stored exclusively in the backend `.env` file. This ensures that even if the database is compromised, the tokens remain secure.

## G. Proposed MongoDB Structure
**1. Student Collection (Additive)**
```json
{
  "_id": "...",
  "github_username": "student123",
  "github_connected": true,
  "github_access_token": "gAAAAAB...", // Encrypted Fernet string
  "github_config": {
    "repository": "labflow-mca-submissions",
    "branch": "main"
  }
}
```

**2. Submission Collection (Additive)**
```json
{
  "_id": "...",
  "submission_id": "sub-nsa-01-FIT25MCA-2008",
  "github": {
    "synced": true,
    "commit_sha": "a1b2c3d4e5f6...",
    "commit_url": "https://github.com/student123/labflow-mca-submissions/commit/a1b2c3d...",
    "path": "NSA/exercise-01/solution.c"
  }
}
```

## H. Proposed Repository Structure
A clean, hierarchical structure organized by Course and Exercise ensures the repository remains readable for faculty and students alike.
```text
[Repository Root]
├── NSA/
│   ├── ex1/
│   │   └── solution.c
│   └── ex2/
│       └── solution.c
├── ADBMS/
│   └── ex1/
│       └── solution.py
└── JAVA/
    └── ex1/
        └── Main.java
```

## I. Proposed File Naming
Use `solution.<extension>` placed inside the specific exercise directory. The extension must be dynamically mapped based on the language of the submission (e.g., `c` -> `.c`, `python` -> `.py`, `java` -> `.java`). This avoids overly verbose file names since the folder path (`NSA/ex1/`) already provides complete context.

## J. Proposed Commit Strategy
- **Commit Message Format**: `LabFlow: Submit <Course Code> <Exercise Title>` (e.g., `LabFlow: Submit NSA Laboratory Exercise 1`).
- **Mechanism**: Use the GitHub REST API (`PUT /repos/{owner}/{repo}/contents/{path}`). This endpoint natively creates the file if it does not exist, or updates it if it does.
- **Requirement for Updates**: If updating an existing file, the GitHub API requires the current file's blob `sha`. The backend must first perform a `GET` request to fetch the existing file's `sha` before issuing the `PUT` request.

## K. Proposed API Routes
To support this integration, the following FastAPI endpoints will be required:
- `GET /api/auth/github/login`: Initiates the GitHub OAuth redirect.
- `GET /api/auth/github/callback`: Handles the OAuth callback, exchanges the code for a token, encrypts it, and saves it to MongoDB.
- `GET /api/student/github/status`: Returns whether GitHub is connected, current username, and current repository configuration (excludes token).
- `GET /api/student/github/repos`: Fetches a list of the user's repositories from GitHub to populate the frontend dropdown.
- `POST /api/student/github/config`: Saves the user's selected repository and branch.
- `POST /api/student/github/disconnect`: Wipes the token and configuration from MongoDB.

## L. Proposed Frontend Flow
1. **Profile Page**: Add a new "GitHub Integration" settings card.
2. **Disconnected State**: Display a "Connect GitHub" button that triggers a redirect to `/api/auth/github/login`.
3. **Connected State**: Display the authenticated GitHub username. Provide dropdowns to select the target repository (populated via the `/repos` endpoint) and branch.
4. **Submission Execution**: The frontend submission flow remains completely unchanged. The IDE simply calls the existing submit endpoint. The backend handles the GitHub synchronization asynchronously or silently during the request.
5. **UI Feedback**: The frontend can optionally display a small GitHub icon or badge on the submission history page based on the `github.synced` boolean returned in the submission document.

## M. GitHub Failure Behavior
The primary directive is that **LabFlow submissions must survive GitHub failures**.
1. The backend `create_or_update_submission` function must first save the submission to MongoDB exactly as it does currently.
2. The GitHub sync operation must be wrapped in a broad `try/except` block.
3. If the GitHub API fails (due to a revoked token, rate limit, deleted repository, or network timeout):
   - The exception is caught.
   - The submission document in MongoDB is updated with `github.synced = False` and an error message (e.g., `github.error = "API Rate Limit Exceeded"`).
   - The backend successfully returns a HTTP 200 to the frontend with a payload like:
     `{"status": "success", "message": "Work submitted successfully. Note: GitHub synchronization failed."}`
4. The student never loses their work, and they are clearly informed of the sync failure.

## N. Security Considerations
- **No Token Exposure**: The GitHub access token must never be sent in any API response.
- **Encryption at Rest**: Tokens must be encrypted in MongoDB using Fernet symmetric encryption.
- **State Validation**: The OAuth flow must use a secure `state` parameter to prevent CSRF attacks during the authorization callback.
- **Secrets Management**: No commits generated by LabFlow should ever contain `.env` files or hardcoded passwords. The scope of the commit is strictly limited to the `submitted_code` string.

## O. Required Environment Variables
Add to `backend/.env`:
```bash
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_REDIRECT_URI=http://localhost:8000/api/auth/github/callback
GITHUB_ENCRYPTION_KEY=base64_fernet_key_here
```

## P. Required Dependencies
The backend requires:
- `httpx`: For making API calls to GitHub (already present).
- `cryptography`: For encrypting and decrypting tokens using `Fernet` (needs to be added to `requirements.txt`).
- `authlib`: Can be reused for GitHub OAuth flow (already present).

## Q. Implementation Order
1. **Infrastructure**: Add `cryptography` to requirements and define new environment variables.
2. **Database Models**: Update the `Student` schema to support the new encrypted token and config fields.
3. **Authentication**: Implement the GitHub OAuth login and callback routes in `auth.py`.
4. **Configuration API**: Implement the routes to get status, list repositories, and save config.
5. **Frontend UI**: Update `Profile.jsx` to render the GitHub connection flow and settings.
6. **Submission Logic**: Refactor `create_or_update_submission` in `submission_service.py` to trigger the GitHub API push after a successful MongoDB save.
7. **Resilience**: Ensure robust error handling and UI feedback for sync failures.

## R. Risks / Edge Cases
- **Revoked Access**: A student might revoke the LabFlow OAuth app directly from their GitHub settings. The next submission will fail with a 401 Unauthorized. The system must catch this, fail the sync gracefully, and optionally clear the invalid token from the database.
- **Repository Deletion**: A student might delete the target repository. The API will return a 404 Not Found. Handled similarly to revoked access.
- **Concurrent Updates**: If a student submits code rapidly in succession, multiple requests to the GitHub API might conflict over the file's `sha` hash. The backend must always fetch the latest `sha` immediately prior to issuing the `PUT` request.
- **API Rate Limits**: The GitHub API limits authenticated users to 5,000 requests per hour. While unlikely to be hit by a single student, the application must handle HTTP 403 Rate Limit Exceeded gracefully.

PHASE 5A AUDIT COMPLETE — NO CODE CHANGED
