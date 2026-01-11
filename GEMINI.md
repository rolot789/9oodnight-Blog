1. /my_blog/README.md 파일은 블로그에 대한 설명을 담고 있다. 하나의 작업이 끝날 때 마다 해당 md 파일을 수정해라. 처음 접한 사람도 이해할 수 있도록 자세하고 상세하게 기술해라. 
2. 코드의 효율성을 따져라. "이렇게 짜는 게 최선인가"를 항상 염두해둬라. 요구하는 기능은 무조건 반영하면서 코드가 이쁘고 깔끔해야돼. 
3. 요구한 사항에 대해서 추가적으로 보완이나 피드백을 반영하고 싶다면 나한테 물어봐라.

---
**2026-01-11 Update:**
- **Authentication:** Added Sign Up functionality and OAuth support (Google, GitHub) to the Login page.
- **Authorization:** implemented Role-Based Access Control (RBAC).
    - **Profiles Table:** Tracks user roles ('user' vs 'admin').
    - **RLS Policies:**
        - Users can create posts.
        - Users can edit/delete only their own posts.
        - Admins can edit/delete ALL posts.
- **Database:** Prepared SQL migration for `profiles` table and `author_id` column on `posts`.