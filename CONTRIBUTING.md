# Contributing to DKS StockAlert

Thank you for your interest in contributing to DKS StockAlert! We welcome contributions from the community.

## 🚀 Getting Started

### Prerequisites

- Node.js 20.12.0 or higher
- npm or yarn
- PostgreSQL database (local or cloud)
- Git

### Development Setup

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/dks-stockalert.git
   cd dks-stockalert
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.sample .env.local
   ```
   
   Edit `.env.local` with your database credentials:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/stockalert"
   ```

5. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   npx prisma db seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Contribution Guidelines

### Creating a Branch

```bash
# Create a feature branch
git checkout -b feature/amazing-feature

# Or create a bug fix branch
git checkout -b fix/bug-description
```

### Making Changes

1. **Write clean, readable code**
   - Follow TypeScript best practices
   - Use meaningful variable names
   - Add comments for complex logic

2. **Follow the existing code style**
   - Run `npm run lint` before committing
   - Fix any linting errors
   - Use the existing component patterns

3. **Test your changes**
   - Run `npm test` to ensure tests pass
   - Add tests for new features
   - Test in multiple browsers if UI changes

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add user authentication
fix: resolve stock calculation bug
docs: update API documentation
style: fix formatting in components
refactor: simplify database queries
test: add unit tests for auth
chore: update dependencies
```

### Submitting Changes

1. **Push your branch**
   ```bash
   git push origin feature/amazing-feature
   ```

2. **Create a Pull Request**
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template

3. **PR Requirements**
   - Clear description of changes
   - Reference any related issues
   - Screenshots for UI changes
   - All tests passing
   - No merge conflicts

## 🐛 Reporting Bugs

Use GitHub Issues to report bugs. Include:

- **Clear description** of the bug
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Screenshots** (if applicable)
- **Environment details**:
  - OS and version
  - Browser and version
  - Node.js version
  - App version

### Bug Report Template

```markdown
**Description**
Brief description of the bug.

**To Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g., Windows 11, macOS 14]
- Browser: [e.g., Chrome 120, Safari 17]
- Node.js: [e.g., 20.12.0]
- App Version: [e.g., 1.0.0]
```

## 💡 Feature Requests

Have an idea? Open a GitHub Issue with:

- Clear description of the feature
- Use case and benefits
- Possible implementation approach
- Mockups or examples (if applicable)

## 🎨 Code Style

### TypeScript

- Use strict TypeScript settings
- Define interfaces for all data structures
- Avoid `any` type when possible
- Use optional chaining (`?.`) and nullish coalescing (`??`)

### React Components

- Use functional components with hooks
- Follow the existing folder structure
- Use Tailwind CSS for styling
- Keep components focused and reusable

### Example:

```typescript
interface ProductCardProps {
  product: Product
  onEdit?: (id: string) => void
}

export function ProductCard({ product, onEdit }: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold">{product.name}</h3>
      {/* ... */}
    </div>
  )
}
```

### Database

- Use Prisma for all database operations
- Add migrations for schema changes
- Include indexes for frequently queried fields
- Use transactions for multi-table operations

## 🔒 Security

- Never commit sensitive data (passwords, API keys, etc.)
- Use environment variables for secrets
- Follow OWASP guidelines
- Report security issues privately (see SECURITY.md)

## 📚 Documentation

- Update README.md if adding major features
- Document API endpoints
- Add JSDoc comments for functions
- Update CHANGELOG.md

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- Auth.test.tsx
```

### Writing Tests

- Test components with React Testing Library
- Test utilities with Jest
- Test API endpoints with integration tests
- Aim for >70% code coverage

### Test Example:

```typescript
import { render, screen } from '@testing-library/react'
import { ProductCard } from './ProductCard'

test('renders product name', () => {
  const product = { id: '1', name: 'Test Product' }
  render(<ProductCard product={product} />)
  expect(screen.getByText('Test Product')).toBeInTheDocument()
})
```

## 🏷️ Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a git tag: `git tag v1.0.0`
4. Push tag: `git push origin v1.0.0`
5. Create GitHub Release with notes

## 🤝 Community Guidelines

- Be respectful and constructive
- Help others in issues and discussions
- Share knowledge and best practices
- Follow the Code of Conduct

## 📞 Questions?

- Open a GitHub Discussion for questions
- Join our community chat (coming soon)
- Email: hello@dksstockalert.com

## 🙏 Thank You!

Every contribution helps make DKS StockAlert better for everyone. We appreciate your time and effort!

---

**Happy coding!** 🚀
