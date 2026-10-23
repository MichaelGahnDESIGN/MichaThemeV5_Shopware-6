import PluginManager from 'src/plugin-system/plugin.manager';
import NotificationCenterPlugin from './notification/notification-center.plugin';
PluginManager.register('MichaThemeNotificationCenter', NotificationCenterPlugin, '[data-mt-notification-center]');
