# Daddy Mear Hogwarts — yükleme ekranı

Oyuncu sunucuya bağlanırken Garry's Mod'un gösterdiği sayfa. Oyun içinde karakter
seçerken çıkan yükleme ekranının birebir kopyası: aynı resimler, aynı teal bant,
aynı ipuçları, köşede aynı hane amblemleri.

Kaynağı `ui/apps/charmenu/src/Loading.tsx` ve `ui/apps/charmenu/src/charmenu.css`
(73-185. satırlar). Oradaki bütün sayılar 1920×1080 sahnede ölçülmüş ham piksel
ve buraya hesaplanarak değil, kopyalanarak taşındı — iki ekranın birbirinden
ayrı düşmemesi için.

## Ne var içinde

```
index.html   sayfa
style.css    charmenu.css'in yükleme bölümünün birebir karşılığı
main.js      ölçek, resim seçimi, ipucu döngüsü, amblem flipbook'u, müzik
assets/      altı yükleme resmi + amblem atlası (6x6)
fonts/       Cinzel ve EB Garamond (woff2 + ttf yedeği)
music.mp3    arka plan müziği
```

Köşedeki hane amblemleri **canvas ile** çiziliyor, CSS maskesiyle değil: oyunun
kendi arayüz tarayıcısı `mask-image` destekliyor ama yükleme ekranının tarayıcısı
desteklemiyor, orada amblemler hiç görünmüyordu. Canvas her yerde çalışır.

Derleme adımı yok. Dosyaları olduğu gibi bir yere koymak yeterli.

## Yayınlama (GitHub Pages)

1. github.com'da **boş ve public** bir depo açın, örneğin `daddy-loading`.
   (README/lisans eklemeyin, boş kalsın.)

2. Bu klasörde:

```bash
git init
git add .
git commit -m "Yükleme ekranı"
git branch -M master
git remote add origin https://github.com/<kullanıcı>/daddy-loading.git
git push -u origin master
```

3. Depoda **Settings → Pages → Build and deployment**: *Deploy from a branch*,
   dal `master`, klasör `/ (root)`. Kaydedin, bir dakika içinde adres çıkar:

```
https://<kullanıcı>.github.io/daddy-loading/
```

Adresi tarayıcıda açıp ekranın geldiğini görün.

## Sunucuya bağlamak

`gmodserver/garrysmod/cfg/server.cfg` içindeki satırı açıp adresi yazın:

```
sv_loadingurl "https://<kullanıcı>.github.io/daddy-loading/"
```

Sondaki `/` önemli: GitHub Pages klasör adreslerini yönlendirir ve oyunun
tarayıcısı yönlendirmeden hoşlanmaz.

Sunucuyu yeniden başlatın. Bundan sonra bağlanan herkes bu sayfayı görür.

## Müzik

`music.mp3` sayfa açılır açılmaz, **%18 ses** ile ve üç saniyede yumuşakça
açılarak başlar; bitince başa döner. Ses seviyesi `main.js` içindeki `VOLUME`
(0 ile 1 arası), açılma süresi `FADE_MS`.

Şarkıyı değiştirmek: yeni dosyayı `music.mp3` adıyla koyun, başka bir şey
gerekmez.

İki şey aklınızda olsun:

- **Boyut.** Şu anki dosya 4,3 MB; sayfanın geri kalanı ~500 KB. Bağlanan
  herkes bunu indiriyor. Daha kısa ya da daha düşük bit hızlı (128 kbps) bir
  sürüm bağlanmayı hissedilir biçimde hızlandırır.
- **Telif.** Sayfa herkese açık bir depoda duracak. Ticari bir şarkıyı orada
  yayınlamak depo kapatılmasına yol açabilir; o da yükleme ekranını topluca
  bozar. Telifsiz bir parça daha güvenli.

Tarayıcılar, sayfaya dokunulmadan sesin başlamasını engelleyebiliyor. Sayfa
engellenirse pes etmiyor: ilk hareket/tıklama/tuşta ve yirmi saniye boyunca
saniyede bir yeniden deniyor. Hiçbiri olmazsa ekran sessiz kalıyor.

Ekran görüntüsü alırken susturmak için: `?mute=1`

## Değiştirmek isterseniz

- **İpuçları:** `main.js` içindeki `TIPS` dizisi. Oyun içindeki liste ayrı bir
  yerde (`Loading.tsx`), ikisini birlikte güncelleyin.
- **Resimler:** `assets/loading/` klasörüne yenisini koyup `main.js`'teki
  `IMAGES` dizisine adını ekleyin. Resimler 2048×1024 (2:1) jpg.
- **Süreler:** `FRAME_MS` (amblem hızı), `TIP_MS` (ipucu süresi).

## Test parametreleri

Ekran görüntüsü alırken rastgeleliği sabitlemek için:

```
?image=hogwarts1&tip=0&frame=0
```

Oyunun kendi eklediği parametreler (`gamemode`, `mapname`, `steamid` …) yok
sayılır.
