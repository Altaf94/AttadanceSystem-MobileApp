import React, { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import SpInAppUpdates, {
  IAUUpdateKind,
  StartUpdateOptions,
} from 'sp-react-native-in-app-updates';
import DeviceInfo from 'react-native-device-info';

/**
 * Invisible component that checks for an in-app update on mount.
 * Place it once at the app root so the check runs regardless of
 * which screen the user is on.
 */
const InAppUpdateChecker: React.FC = () => {
  const hasCheckedUpdate = useRef(false);

  const checkInAppUpdate = useCallback(() => {
    if (Platform.OS !== 'android' || hasCheckedUpdate.current) {
      return;
    }
    hasCheckedUpdate.current = true;

    const inAppUpdates = new SpInAppUpdates(false);
    inAppUpdates
      .checkNeedsUpdate({ curVersion: DeviceInfo.getVersion() })
      .then((result) => {
        if (result.shouldUpdate) {
          const updateOptions: StartUpdateOptions = {
            updateType: IAUUpdateKind.IMMEDIATE,
          };
          return inAppUpdates.startUpdate(updateOptions);
        }
      })
      .catch((updateError: unknown) => {
        const message =
          updateError instanceof Error ? updateError.message : String(updateError);
        console.log('In-app update check failed:', message);
      });
  }, []);

  useEffect(() => {
    checkInAppUpdate();
  }, [checkInAppUpdate]);

  return null;
};

export default InAppUpdateChecker;
