# Contributing to StellarPay

Thank you for your interest in contributing to StellarPay! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Browser and OS information

### Suggesting Features

We welcome feature suggestions! Please create an issue with:
- Clear description of the feature
- Use case and benefits
- Possible implementation approach
- Any relevant examples

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/stellarpay-dapp.git
   cd stellarpay-dapp
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Write clean, readable code
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Test your changes**
   ```bash
   npm run dev
   npm test
   npm run lint
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   Use conventional commit messages:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template
   - Submit!

## 📝 Code Style

### JavaScript/TypeScript

- Use TypeScript for new files when possible
- Use functional components with hooks
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep functions small and focused

### React Components

```typescript
// Good example
export default function ComponentName({ prop1, prop2 }: Props) {
  const [state, setState] = useState(initialValue);
  
  const handleAction = () => {
    // Handle action
  };
  
  return (
    <div className="container">
      {/* Component content */}
    </div>
  );
}
```

### CSS/Tailwind

- Use Tailwind utility classes
- Follow the existing design system
- Use semantic class names
- Keep responsive design in mind

## 🧪 Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Test on multiple browsers if possible
- Test with Freighter wallet integration

## 📚 Documentation

- Update README.md if adding features
- Add JSDoc comments for functions
- Update CHANGELOG.md
- Add screenshots for UI changes

## 🔍 Code Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged
4. Your contribution will be credited

## 🎯 Development Setup

### Prerequisites
- Node.js v16+
- npm or yarn
- Freighter wallet extension
- Git

### Setup Steps
```bash
# Clone your fork
git clone https://github.com/yourusername/stellarpay-dapp.git

# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 🐛 Debugging

### Common Issues

**Freighter not connecting:**
- Check if extension is installed
- Verify network is set to Testnet
- Clear browser cache

**Build errors:**
- Delete `node_modules` and reinstall
- Check Node.js version
- Clear Vite cache

**Transaction failures:**
- Verify account has sufficient balance
- Check network connection
- Ensure Freighter is unlocked

## 📞 Getting Help

- **Discord**: Join Stellar Discord
- **Documentation**: Check Stellar docs
- **Issues**: Create a GitHub issue
- **Discussions**: Use GitHub Discussions

## 🌟 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in the README

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## ✅ Checklist

Before submitting a PR, ensure:

- [ ] Code follows the style guide
- [ ] Tests pass (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation is updated
- [ ] Commit messages are clear
- [ ] PR description is complete
- [ ] Screenshots added (if UI changes)

## 🎉 Thank You!

Your contributions make StellarPay better for everyone. We appreciate your time and effort!

---

**Questions?** Feel free to ask in the issues or discussions section.
