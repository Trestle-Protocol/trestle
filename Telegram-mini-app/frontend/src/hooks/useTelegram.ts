export function useTelegram() {
  const tg = window.Telegram?.WebApp;

  const ready = () => tg?.ready();
  const expand = () => tg?.expand();
  const showMainButton = (text: string, onClick: () => void) => {
    if (!tg) return;
    tg.MainButton.text = text;
    tg.MainButton.show();
    tg.MainButton.onClick(onClick);
  };
  const hideMainButton = () => tg?.MainButton.hide();

  const user = tg?.initDataUnsafe?.user ?? null;
  const colorScheme = tg?.colorScheme ?? "light";

  return { tg, user, colorScheme, ready, expand, showMainButton, hideMainButton };
}
