/**
 * デバイス識別子の管理
 *
 * 複数スタッフが異なるデバイスで同時ログインできるようにするため、
 * デバイスごとに一意なIDを生成・管理する。
 */

/**
 * クライアント専用: デバイスIDを取得または新規作成
 *
 * LocalStorageに保存されたデバイスIDを取得する。
 * 存在しない場合は新規にUUIDを生成して保存する。
 *
 * @returns デバイスID（UUID形式）。LocalStorageが使えない場合は空文字列
 */
export function getOrCreateDeviceId(): string {
  // サーバーサイドレンダリング時は何もしない
  if (typeof window === 'undefined') return '';

  try {
    let deviceId = localStorage.getItem('admin_device_id');

    if (!deviceId) {
      // UUID v4 を生成
      deviceId = crypto.randomUUID();
      localStorage.setItem('admin_device_id', deviceId);
      console.log('🆔 新しいデバイスIDを生成:', deviceId);
    }

    return deviceId;
  } catch (error) {
    // LocalStorageが使えない環境（プライベートブラウジング等）
    console.warn('⚠️ LocalStorageが使用できません。従来のセッション方式にフォールバックします。', error);
    return '';
  }
}

/**
 * サーバー専用: デバイスIDからCookie名を生成
 *
 * @param deviceId デバイスID（オプション）
 * @returns Cookie名（例: "admin_session_abc-123-def"）
 */
export function getSessionCookieName(deviceId?: string): string {
  if (deviceId && deviceId.trim() !== '') {
    return `admin_session_${deviceId}`;
  }
  // デバイスIDがない場合は従来のCookie名（下位互換性）
  return 'admin_session';
}
