module.exports = {
    "*.{js,json,md,yml}": "yarn exec prettier --check",
    "*.{ts,tsx,js,jsx,json,css,scss,md}": () => "yarn lint:eslint",
    "*.{ts,tsx}": () => "yarn lint:tsc",
};
