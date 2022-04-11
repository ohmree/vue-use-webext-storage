import { createApp } from 'vue';
import App from './Options.vue';
import * as devtools from '@vue/devtools';
import '../styles';

devtools.connect(undefined, 8098);

const app = createApp(App);
app.mount('#app');
