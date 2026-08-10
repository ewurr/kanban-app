#!/bin/sh

echo "Scheduler başladı. Her 15 dakikada bir app:check-due-dates çalışacak."

while true; do
    echo "$(date): due-date taraması başlıyor..."
    php bin/console app:check-due-dates
    echo "$(date): tarama tamamlandı, 15 dakika bekleniyor."
    sleep 900
done