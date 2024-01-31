module.exports = {
    "*.{js,json,md,yml}": "npx prettier --check",
    "*.{ts,tsx,js,jsx,json,css,scss,md}": () => "npm run lint:eslint",
    "*.{ts,tsx}": () => "npm run lint:tsc",
};
