// Required to allow importing images with webpack in typescript
declare module "*.png";
declare module "*.jpg";
declare module "*.svg";
interface File {
  path: string; // Electron-specific
}