import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount(
  (() => {
    const app = document.createElement('div');
    app.style.position = "fixed";
    app.style.borderRadius = "8px";
    app.style.left = "8px";
    app.style.bottom = "8px";
    app.style.padding = "4px";
    app.style.zIndex = "9999";
    document.body.append(app);
    return app;
  })(),
);
