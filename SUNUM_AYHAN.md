# miniSocial — Ayhan'ın Geliştirdiği Özellikler

---

## 1. Frontend Mimarisi

**Teknoloji:** Next.js 15 (App Router) + TypeScript + SASS

### Kilit Noktalar
- **`"use client"`** direktifi: Sayfa client-side React bileşeni olduğunu belirtir. Next.js App Router'da default server component'tir, bu direktif olmadan `useState`/`useEffect` çalışmaz.
- **Dosya sistemi routing:** `app/home/page.tsx` → `/home`, `app/profile/[id]/page.tsx` → `/profile/123` gibi URL'ler otomatik oluşur.
- **`NEXT_PUBLIC_API_URL`:** Frontend'den backend'e istek atmak için environment variable. `NEXT_PUBLIC_` prefix'i olmadan tarayıcıya expose olmaz.
- **JWT cookie:** Her API isteğinde `Cookies.get("token")` ile alınır ve `Authorization: Bearer <token>` header'ına eklenir.

---

## 2. Authentication (JWT ile Korunan Sayfalar)

**Dosya:** Her sayfa başında aynı pattern

```ts
const token = Cookies.get("token");
if (!token) {
  router.push("/");  // token yoksa login sayfasına yönlendir
  return;
}
```

### Nasıl Çalışır?
1. Kullanıcı login olunca backend JWT token döner
2. Token `js-cookie` kütüphanesiyle cookie'ye yazılır
3. Her korunan sayfa mount olduğunda token varlığını kontrol eder
4. Token yoksa → `/` (login sayfası)
5. Token varsa → `GET /auth/me` ile kullanıcı bilgileri çekilir

### Kilit Nokta
`authHeaders()` yardımcı fonksiyonu her sayfada tekrarlanır. `Content-Type: application/json` + `Authorization` header'larını bir arada döner.

---

## 3. Home Feed (Ana Sayfa)

**Dosya:** `app/home/page.tsx`

### İşlev
- Takip edilen kullanıcıların postlarını kronolojik sırayla listeler
- Post oluşturma (composer) bileşeni içerir
- Like/unlike, yorum, post silme işlemleri

### Nasıl Çalışır?
1. `GET /posts/feed` → sadece takip edilen kullanıcıların postları gelir
2. `mapPost()` fonksiyonu backend verisini frontend tipine dönüştürür
3. `timeAgo()` fonksiyonu tarihi "2m ago", "3h ago" formatına çevirir

### Optimistic UI (Like)
```
Kullanıcı like'a tıklar
→ Önce STATE güncellenir (anında görsel tepki)
→ Sonra API isteği atılır
→ API başarısız olursa state geri alınır
→ API başarılıysa gerçek sayı state'e yazılır
```
Bu pattern kullanıcıya lag hissettirmez.

### Post Oluşturma Akışı
1. Attachment varsa önce `POST /upload` → `fileId` alınır
2. Sonra `POST /posts` body'sine `{ content, fileId }` gönderilir
3. Backend'den dönen yeni post, state'in başına eklenir (sayfa yenilemez)

---

## 4. Explore Sayfası

**Dosya:** `app/explore/page.tsx`

### İşlev
Takip edilmeyen kullanıcıların postlarını gösterir — keşif/discovery alanı.

### Fark
- Home feed: `GET /posts/feed` (sadece following)
- Explore: `GET /posts/explore` (following dışındakiler)
- Aynı `Post` bileşeni kullanılır, sadece endpoint farklıdır

---

## 5. Profil Sayfası

**Dosya:** `app/profile/[id]/page.tsx`

### İşlev
- Herhangi bir kullanıcının profilini görüntüler
- Follow/unfollow
- Kullanıcının postlarını listeler

### Nasıl Çalışır?
- URL'deki `[id]` dynamic route parametresi: `params.id`
- `GET /users/:id` → profil bilgileri
- `GET /posts/user/:id` → o kullanıcının postları
- Kendi profilin mi? → `currentUser.id === profileUser.id` karşılaştırması
  - Evet: Edit profile butonu gösterilir
  - Hayır: Follow/Unfollow butonu gösterilir

### Follow Akışı
```
POST /users/:id/follow   → takip et
DELETE /users/:id/follow → takibi bırak
```
State optimistic güncellenir (sayaçlar anında değişir).

---

## 6. Arama Sayfası

**Dosya:** `app/search/page.tsx` + `Topbar` bileşeni

### İşlev
- `#hashtag` ile post arama
- `@username` ile kullanıcı arama

### Nasıl Çalışır?
1. Topbar'daki arama kutusu submit edildiğinde `/search?q=<query>` URL'ine yönlendirir
2. Search sayfası `useSearchParams()` ile `q` parametresini okur
3. `q` `#` ile başlıyorsa → `GET /posts/search?hashtag=...`
4. `q` `@` ile başlıyorsa → `GET /users/search?q=...`
5. Aksi halde ikisi de çağrılır

---

## 7. Trending Hashtags (RightSidebar)

**Dosya:** `components/RightSidebar.tsx`

### İşlev
En çok kullanılan hashtag'leri sidebar'da gösterir. Tıklanınca search sayfasına yönlendirir.

### Nasıl Çalışır?
- `GET /posts/trending-hashtags` → `[{ tag: "#react", count: 5 }, ...]`
- Her chip'e tıklandığında `/search?q=%23react` URL'ine router.push

### RTL Desteği
```ts
const isRTL = i18n.language === "ar";
const textStyle = isRTL ? { direction: "rtl", textAlign: "right" } : {};
```
Dil Arapça'ya geçince sidebar içeriği sağdan sola hizalanır.

---

## 8. ProfileCard (Sol Sidebar)

**Dosya:** `components/ProfileCard.tsx`

### İşlev
- Giriş yapan kullanıcının özet kartı: avatar, username, post/follower/following sayıları
- Followers ve Following sayılarına tıklanınca modal açılır

### Modal Yapısı
```
stat'a tıkla → showModal: "followers" | "following"
→ GET /users/me/followers veya /users/me/following
→ liste modal'da gösterilir
→ Kullanıcıya tıklanınca /profile/:id sayfasına git
→ Following listesinden Unfollow yapılabilir (DELETE /users/:id/follow)
```

---

## 9. Messages (Chat)

**Dosya:** `app/messages/page.tsx`

### İşlev
- Kullanıcılar arası gerçek zamanlı mesajlaşma
- Online/offline status
- Okunmamış mesaj sayısı (badge)

### WebSocket Akışı
```
1. Socket.io bağlantısı kurulur (auth: { token })
2. socket.emit("sendMessage", { receiverId, content })
3. socket.on("newMessage", ...) → gelen mesajlar state'e eklenir
4. socket.on("messageSent", ...) → gönderilen mesaj state'e eklenir
```

### Unread Badge
`Topbar` veya sol sidebar'da 5 saniyelik polling ile `GET /messages/unread-count` çağrılır. Sayı > 0 ise badge gösterilir.

---

## 10. Admin Panel

**Dosya:** `app/admin/page.tsx`

### İşlev
Sadece `role: "admin"` olan kullanıcılar erişebilir. Kullanıcı ve post yönetimi.

### Erişim Kontrolü
```ts
fetch("/auth/me").then(me => {
  if (me.role !== "admin") router.push("/home"); // admin değilse çık
})
```
Frontend kontrolü + backend'de `AdminGuard` ile çift katman koruma.

### Yetenekler
| İşlem | Endpoint |
|---|---|
| Tüm kullanıcıları listele | GET /admin/users |
| Kullanıcı sil | DELETE /admin/users/:id |
| Avatar değiştir | PATCH /admin/users/:id/avatar |
| Bio düzenle | PATCH /admin/users/:id/bio |
| Rol değiştir (user↔admin) | PATCH /admin/users/:id/role |
| Post sil | DELETE /admin/posts/:id |

### State Güncellemesi
API başarılı olduktan sonra sayfayı yenilemek yerine:
```ts
setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
```
Sadece değişen kullanıcı state'te güncellenir.

---

## 11. Settings Sayfası

**Dosya:** `app/settings/page.tsx`

### İşlev
- Dil değiştirme (EN/TR/DE/AR)
- 2FA açma/kapatma
- Hesap silme

### Dil Değiştirme Akışı
```
1. select onChange → i18n.changeLanguage(value)
2. localStorage.setItem("language", value)  ← sayfa yenilenince hatırla
3. PATCH /auth/language  ← backend'e de kaydet
4. Dil anında değişir (sayfa yenilemez)
```

### 2FA Aktifleştirme
```
1. POST /2fa/generate → QR code URL döner
2. popup window açılır, QR code gösterilir
3. Kullanıcı Google Authenticator ile okur
4. window.postMessage("twofactor:enabled") ile popup'tan parent'a haber verilir
5. Parent sayfa 2FA'yı aktif olarak işaretler
```

### Hesap Silme
- Modal'da kullanıcı "DELETE" yazmak zorunda (onay mekanizması)
- `DELETE /users/me` → token silinir → login sayfasına yönlendirilir

---

## 12. i18n (Çok Dil Desteği)

**Dosya:** `app/i18n.ts` + `public/locales/[lang]/translation.json`

### Nasıl Çalışır?
```ts
const { t } = useTranslation();
t("home.whats_happening")  // "What's happening?" / "Ne düşünüyorsun?" / ...
```
- 4 dil: EN, TR, DE, AR
- JSON dosyalarında anahtar-değer çiftleri
- `react-i18next` kütüphanesi runtime'da doğru çeviriyi yükler

### RTL (Sağdan Sola)
Arapça seçildiğinde:
```ts
document.documentElement.setAttribute("dir", "rtl");
```
Tüm layout otomatik ayna görüntüsüne döner. Metin alanlarında `dir="auto"` kullanılır — Latin yazınca LTR, Arapça yazınca RTL olur.

---

## 13. Post Bileşeni

**Dosya:** `components/Post.tsx`

### Özellikler
- **Uzun içerik:** `useLayoutEffect` ile `scrollHeight > lineHeight` ise "Show more" butonu gösterilir
- **Context menu (3 nokta):** `createPortal` ile body'ye render edilir — taşma sorununu önler
- **Yorum sistemi:** Yorum sayısına tıklanınca `GET /posts/:id/comments` çağrılır, liste açılır
- **Dosya önizleme:** Post'taki görseller `GET /upload/:fileId` endpoint'inden çekilir
- **Optimistic like:** (Home sayfasından callback olarak gelir)

---

## 14. SASS (globals.scss)

**Dosya:** `app/globals.scss`

### Neden SASS?
CSS framework kullanılmadığı için tüm stiller custom yazıldı. SASS'ın sağladığı avantajlar:

| SASS Özelliği | Kullanım |
|---|---|
| `$accent: #7c5cff` | Renk değişkenleri bir yerde tanımlı |
| `&:hover { }` | Nesting ile ilgili stiller bir arada |
| `rgba($accent, 0.18)` | Değişkenle `rgba()` hesabı |
| `&.active { }` | Modifier class'lar parent altında |

CSS custom properties (`:root` içindeki `--accent` vb.) hâlâ var çünkü JavaScript'te `var(--accent)` okunması gerekiyor.

---

## Özet: Kullanılan Kilit Pattern'lar

| Pattern | Nerede |
|---|---|
| Optimistic UI | Like, follow/unfollow |
| JWT guard (her sayfada) | Token kontrolü + redirect |
| `mapPost()` ile veri dönüşümü | Home, Explore, Profile |
| State filtreleme (sil) | `prev.filter(x => x.id !== id)` |
| State map (güncelle) | `prev.map(x => x.id === id ? {...x, alan: yeni} : x)` |
| Portal ile dropdown | Post context menu |
| window.postMessage | 2FA popup → parent iletişim |
| localStorage + i18n | Dil tercihi hatırlama |
