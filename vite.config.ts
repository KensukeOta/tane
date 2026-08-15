import { defineConfig } from "vite";

export default defineConfig(({ command, mode }) => {
  if (command === "serve") {
    return {
      base: "/",
    };
  }

  return {
    base: mode === "holyland" ? "./" : "/tane/",
  };
});
