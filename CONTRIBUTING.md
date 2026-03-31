# Contributing to Fitness App Dashboard

Thank you for your interest in contributing to the Fitness App Dashboard! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Git
- A code editor like VS Code

### Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/Fitness-App-Dashboard.git
   cd Fitness-App-Dashboard
   ```
3. Add the original repository as upstream:
   ```bash
   git remote add upstream https://github.com/surajsm31/Fitness-App-Dashboard.git
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Guidelines

### Code Style

- Use ESLint configuration provided in the project
- Follow React best practices
- Use Tailwind CSS for styling
- Keep components small and focused
- Use meaningful variable and function names

### Component Structure

```jsx
// Example component structure
import React from 'react';
import { useState, useEffect } from 'react';

const ComponentName = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Side effects
  }, [dependencies]);

  return (
    <div className="tailwind-classes">
      {/* JSX content */}
    </div>
  );
};

export default ComponentName;
```

### Commit Messages

Use conventional commit messages:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

Example:
```
feat: add BMI calculator widget
fix: resolve chart rendering issue on mobile devices
```

## Pull Request Process

1. Ensure your code follows the project's style guidelines
2. Run the linter:
   ```bash
   npm run lint
   ```
3. Test your changes thoroughly
4. Update documentation if needed
5. Commit your changes with a clear message
6. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
7. Create a pull request on GitHub

### Pull Request Template

When creating a pull request, please include:

- **Description**: What changes you made and why
- **Type of Change**: Bug fix, new feature, breaking change, etc.
- **Testing**: How you tested your changes
- **Screenshots**: If applicable, include screenshots

## Issues

### Bug Reports

When reporting a bug, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, Node.js version)
- Screenshots if applicable

### Feature Requests

When requesting a feature, please include:
- Clear description of the feature
- Use case and motivation
- Any implementation ideas

## Questions

If you have questions about contributing, feel free to:
- Open an issue with the "question" label
- Start a discussion in the repository

Thank you for contributing to the Fitness App Dashboard! 🚀
