 POS Uygulamasına e-Adisyon Entegrasyonu - Kapsamlı Plan

  1. PROJE GEREKSİNİMLERİ VE YASAL ALTYAPI

  1.1 e-Adisyon Nedir?

  - Gelir İdaresi Başkanlığı (GİB) tarafından yayınlanan elektronik adisyon belgesi sistemi
  - Masa servisi veren restoran, pastane, kafeterya vb. işletmeler için zorunlu
  - Gerçek usulde vergilendirilen işletmeler için geçerli
  - XML tabanlı UBL-TR 1.2.1 standardı kullanılıyor

  1.2 Zorunlu Bilgiler

  - İşletme adı, vergi dairesi, TCKN/VKN ve adres
  - Belge tarihi ve saati
  - Evrensel Tekil Tanımlayıcı Numara (ETTN)
  - e-Belge numarası
  - Hizmet/ürün adı ve miktarı
  - Vergiler dahil/hariç toplam tutar

  1.3 Entegrasyon Yöntemleri

  1. Özel Entegratör Yöntemi: GİB onaylı entegratör firma üzerinden
  2. Doğrudan Entegrasyon: Doğrudan GİB sistemine bağlantı

  2. TEKNİK MİMARİ VE TASARIM

  2.1 Sistem Bileşenleri

  ┌─────────────────────────────────────────────────────┐
  │              POS Uygulaması                         │
  │  ┌────────────────────────────────────────────┐    │
  │  │  Sipariş Yönetimi (Mevcut)                 │    │
  │  └────────────────┬───────────────────────────┘    │
  │                   │                                 │
  │  ┌────────────────▼───────────────────────────┐    │
  │  │  e-Adisyon Modülü (YENİ)                   │    │
  │  │  - XML Oluşturucu                          │    │
  │  │  - Mali Mühür Entegrasyonu                 │    │
  │  │  - ETTN Üretici                            │    │
  │  │  - Zaman Damgası                           │    │
  │  └────────────────┬───────────────────────────┘    │
  │                   │                                 │
  │  ┌────────────────▼───────────────────────────┐    │
  │  │  e-Arşiv Rapor Yönetimi (YENİ)            │    │
  │  │  - Günlük/Aylık Raporlar                   │    │
  │  │  - Rapor İmzalama                          │    │
  │  └────────────────┬───────────────────────────┘    │
  └───────────────────┼─────────────────────────────────┘
                      │
                      │ HTTPS/Web Service
                      │
           ┌──────────▼──────────────┐
           │  GİB e-Belge Sistemi    │
           │  veya                   │
           │  Özel Entegratör API    │
           └─────────────────────────┘

  2.2 Veri Akışı

  1. Sipariş Kapanışı → Adisyon belgesi oluşturma tetiklenir
  2. XML Belgesi Oluşturma → UBL-TR 1.2.1 formatında
  3. ETTN Üretimi → UUID ile benzersiz numara
  4. Mali Mühür ve Zaman Damgası → Belge imzalama
  5. GİB'e İletim → Web servis üzerinden gönderim
  6. Yanıt İşleme → Kabul/Red durumu kontrolü
  7. Lokal Arşivleme → 5 yıl saklama zorunluluğu

  3. GELİŞTİRME AŞAMALARI

  3.1 Faz 1: Altyapı Hazırlığı (1-2 hafta)

  Gerekli Kütüphaneler ve Bağımlılıklar:
  - XML işleme kütüphanesi (platform bağımlı: .NET için System.Xml, Java için JAXB)
  - UUID/GUID üretici
  - Şifreleme/imzalama kütüphaneleri (Mali Mühür için)
  - HTTP/HTTPS client (GİB API çağrıları)
  - Veritabanı şema güncellemeleri

  Veritabanı Yapısı:
  -- e-Adisyon belgeleri tablosu
  CREATE TABLE e_adisyon_belgeler (
      id BIGINT PRIMARY KEY,
      ettn VARCHAR(36) UNIQUE NOT NULL,
      belge_no VARCHAR(50) NOT NULL,
      siparis_id BIGINT REFERENCES siparisler(id),
      belge_tarihi TIMESTAMP NOT NULL,
      xml_icerik TEXT NOT NULL,
      imzali_xml TEXT,
      durum VARCHAR(20), -- OLUSTURULDU, GONDERILDI, KABUL_EDILDI, REDDEDILDI
      gib_yanit TEXT,
      olusturma_tarihi TIMESTAMP DEFAULT NOW(),
      gonderim_tarihi TIMESTAMP,
      INDEX idx_ettn (ettn),
      INDEX idx_belge_no (belge_no),
      INDEX idx_durum (durum)
  );

  -- e-Arşiv raporları tablosu
  CREATE TABLE e_arsiv_raporlar (
      id BIGINT PRIMARY KEY,
      rapor_tipi VARCHAR(20), -- GUNLUK, AYLIK
      baslangic_tarihi DATE NOT NULL,
      bitis_tarihi DATE NOT NULL,
      xml_icerik TEXT NOT NULL,
      imzali_xml TEXT,
      durum VARCHAR(20),
      gib_yanit TEXT,
      olusturma_tarihi TIMESTAMP DEFAULT NOW(),
      gonderim_tarihi TIMESTAMP
  );

  -- İmzalama sertifikaları
  CREATE TABLE mali_muhur_sertifikalar (
      id BIGINT PRIMARY KEY,
      sertifika_no VARCHAR(100) NOT NULL,
      sertifika_icerik BYTEA NOT NULL,
      gecerlilik_baslangic DATE NOT NULL,
      gecerlilik_bitis DATE NOT NULL,
      aktif BOOLEAN DEFAULT TRUE,
      olusturma_tarihi TIMESTAMP DEFAULT NOW()
  );

  3.2 Faz 2: XML Belge Oluşturma (2-3 hafta)

  XML Şeması (UBL-TR 1.2.1):
  <?xml version="1.0" encoding="UTF-8"?>
  <AdditionDocument xmlns="urn:oasis:names:specification:ubl:schema:xsd:AdditionDocument-2"
                    xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
                    xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
      <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
      <cbc:CustomizationID>TR1.2.1</cbc:CustomizationID>
      <cbc:ID>ADI2025000000001</cbc:ID>
      <cbc:UUID>550e8400-e29b-41d4-a716-446655440000</cbc:UUID>
      <cbc:IssueDate>2025-12-30</cbc:IssueDate>
      <cbc:IssueTime>14:30:00</cbc:IssueTime>

      <!-- Satıcı Bilgileri -->
      <cac:AccountingSupplierParty>
          <cac:Party>
              <cac:PartyIdentification>
                  <cbc:ID schemeID="VKN">1234567890</cbc:ID>
              </cac:PartyIdentification>
              <cac:PartyName>
                  <cbc:Name>ÖRNEK RESTORAN A.Ş.</cbc:Name>
              </cac:PartyName>
              <cac:PostalAddress>
                  <cbc:StreetName>Atatürk Caddesi</cbc:StreetName>
                  <cbc:BuildingNumber>123</cbc:BuildingNumber>
                  <cbc:CityName>İstanbul</cbc:CityName>
                  <cbc:PostalZone>34000</cbc:PostalZone>
                  <cac:Country>
                      <cbc:Name>Türkiye</cbc:Name>
                  </cac:Country>
              </cac:PostalAddress>
          </cac:Party>
      </cac:AccountingSupplierParty>

      <!-- Ürün/Hizmet Satırları -->
      <cac:AdditionLine>
          <cbc:ID>1</cbc:ID>
          <cbc:Quantity>2</cbc:Quantity>
          <cac:Item>
              <cbc:Name>Espresso</cbc:Name>
          </cac:Item>
          <cac:Price>
              <cbc:PriceAmount currencyID="TRY">50.00</cbc:PriceAmount>
          </cac:Price>
          <cac:TaxTotal>
              <cbc:TaxAmount currencyID="TRY">10.00</cbc:TaxAmount>
              <cac:TaxSubtotal>
                  <cbc:Percent>20</cbc:Percent>
                  <cac:TaxCategory>
                      <cac:TaxScheme>
                          <cbc:Name>KDV</cbc:Name>
                      </cac:TaxScheme>
                  </cac:TaxCategory>
              </cac:TaxSubtotal>
          </cac:TaxTotal>
      </cac:AdditionLine>

      <!-- Toplam Tutarlar -->
      <cac:LegalMonetaryTotal>
          <cbc:LineExtensionAmount currencyID="TRY">100.00</cbc:LineExtensionAmount>
          <cbc:TaxExclusiveAmount currencyID="TRY">100.00</cbc:TaxExclusiveAmount>
          <cbc:TaxInclusiveAmount currencyID="TRY">120.00</cbc:TaxInclusiveAmount>
          <cbc:PayableAmount currencyID="TRY">120.00</cbc:PayableAmount>
      </cac:LegalMonetaryTotal>
  </AdditionDocument>

  Geliştirme Görevleri:
  - XML builder sınıfı oluşturma
  - XSD şema validasyonu entegrasyonu
  - Sipariş verilerini XML'e dönüştürme mapping katmanı
  - ETTN/UUID üretim servisi
  - Para birimi ve vergi hesaplama modülleri

  3.3 Faz 3: Mali Mühür ve İmzalama (2 hafta)

  Gereksinimler:
  - Mali Mühür sertifikası (GİB'den alınmalı)
  - Zaman damgası servisi entegrasyonu
  - XMLDSig implementasyonu

  Kritik Noktalar:
  - Sertifika yönetimi (yenileme, yedekleme)
  - HSM (Hardware Security Module) kullanımı önerilir
  - Zaman damgası TSA (Time Stamp Authority) servisi

  3.4 Faz 4: GİB API Entegrasyonu (2-3 hafta)

  Entegrasyon Seçenekleri:

  Seçenek A: Özel Entegratör (Önerilen - Başlangıç için)
  - İziBiz, Foriba, Sovos, NES gibi firmalar
  - Hazır API ve SDK'lar
  - Teknik destek
  - Test ortamı sağlanır

  Seçenek B: Doğrudan Entegrasyon
  - GİB Web Servis entegrasyonu
  - Daha fazla teknik bilgi gerektirir
  - Bakım maliyeti yüksek

  API İşlevleri:
  // Örnek API çağrı yapısı
  class EAdisyonService {
    // Belge gönderimi
    async gonderBelge(xmlBelge, imza) {
      const endpoint = process.env.GIB_API_URL + '/belge-gonder';
      const response = await httpClient.post(endpoint, {
        belge: xmlBelge,
        imza: imza,
        ettn: this.extractETTN(xmlBelge)
      });
      return response;
    }

    // Belge durumu sorgulama
    async belgeDurumuSorgula(ettn) {
      const endpoint = process.env.GIB_API_URL + '/belge-sorgula';
      const response = await httpClient.get(endpoint, {
        params: { ettn }
      });
      return response;
    }

    // e-Arşiv rapor gönderimi
    async raporGonder(raporXml, raporTipi, baslangic, bitis) {
      const endpoint = process.env.GIB_API_URL + '/rapor-gonder';
      const response = await httpClient.post(endpoint, {
        rapor: raporXml,
        tip: raporTipi, // GUNLUK veya AYLIK
        baslangic_tarihi: baslangic,
        bitis_tarihi: bitis
      });
      return response;
    }
  }

  3.5 Faz 5: Kullanıcı Arayüzü (1-2 hafta)

  POS Ekranına Eklenecek Özellikler:
  - e-Adisyon durumu göstergesi (gönderildi/kabul edildi/reddedildi)
  - Manuel yeniden gönderim butonu (başarısız belgeler için)
  - e-Adisyon yazdırma seçeneği
  - Tarih aralığına göre e-Adisyon listesi
  - e-Arşiv rapor görüntüleme

  Raporlama Ekranları:
  - Günlük e-Adisyon özeti
  - Aylık e-Arşiv raporu görüntüleme
  - Başarısız belge listesi
  - GİB yanıt durumları

  3.6 Faz 6: Hata Yönetimi ve Queue Sistemi (1-2 hafta)

  Kritik Senaryolar:
  - İnternet bağlantısı kesilirse
  - GİB servisleri yanıt vermezse
  - Belge reddedilirse

  Çözüm: Queue (Kuyruk) Sistemi
  // Queue yapısı
  class EAdisyonQueue {
    constructor() {
      this.queue = []; // veya Redis/RabbitMQ
      this.retryAttempts = 3;
      this.retryDelay = 60000; // 1 dakika
    }

    async ekle(belge) {
      this.queue.push({
        belge: belge,
        durum: 'BEKLEMEDE',
        deneme_sayisi: 0,
        olusturma_zamani: new Date()
      });
      await this.islet();
    }

    async islet() {
      for (let item of this.queue) {
        if (item.durum === 'BEKLEMEDE' ||
            (item.durum === 'HATA' && item.deneme_sayisi < this.retryAttempts)) {
          try {
            const sonuc = await eAdisyonService.gonderBelge(item.belge);
            item.durum = 'GONDERILDI';
            item.gib_yanit = sonuc;
            // Veritabanını güncelle
            await this.veritabaniGuncelle(item);
          } catch (error) {
            item.durum = 'HATA';
            item.deneme_sayisi++;
            item.hata_mesaji = error.message;
            // Retry mekanizması
            setTimeout(() => this.islet(), this.retryDelay);
          }
        }
      }
    }
  }

  3.7 Faz 7: e-Arşiv Rapor Sistemi (1 hafta)

  Günlük ve Aylık Raporlar:
  - Her gün sonunda otomatik günlük rapor oluşturma
  - Her ay sonunda aylık rapor oluşturma
  - Raporların GİB'e otomatik gönderimi

  Rapor İçeriği:
  - Toplam belge sayısı
  - Toplam satış tutarı
  - Toplam KDV
  - İptal edilen belgeler
  - Belge numarası aralıkları

  4. TEST SÜRECİ

  4.1 Test Ortamı (GİB Test Sistemi)

  - GİB tarafından sağlanan test ortamına başvuru
  - Test sertifikaları alınması
  - Test API endpoint'lerinin yapılandırılması

  4.2 Test Senaryoları

  Fonksiyonel Testler:
  - ✓ Basit adisyon oluşturma (1 ürün)
  - ✓ Çoklu ürün adisyonu
  - ✓ İndirimli satış
  - ✓ Farklı KDV oranları
  - ✓ İade işlemleri
  - ✓ İptal işlemleri

  Entegrasyon Testleri:
  - ✓ GİB API bağlantı testi
  - ✓ Mali mühür imzalama
  - ✓ Zaman damgası servisi
  - ✓ Belge gönderimi ve yanıt alma
  - ✓ Hata durumlarında retry mekanizması

  Performans Testleri:
  - ✓ Yüksek yoğunlukta belge oluşturma (100+ adisyon/saat)
  - ✓ Queue sistemi yük testi
  - ✓ Veritabanı performansı

  Güvenlik Testleri:
  - ✓ Sertifika güvenliği
  - ✓ HTTPS bağlantı doğrulaması
  - ✓ Veri şifreleme

  4.3 UAT (Kullanıcı Kabul Testleri)

  - Gerçek restoran ortamında pilot uygulama
  - Personel eğitimi
  - Feedback toplama ve iyileştirme

  5. CANLI ORTAM GEÇİŞİ

  5.1 Ön Hazırlıklar

  - GİB'e e-Adisyon kullanım başvurusu
  - Gerçek Mali Mühür sertifikası temini
  - Prod API bilgilerinin yapılandırılması
  - Veritabanı yedekleme stratejisi
  - Rollback planı hazırlama

  5.2 Geçiş Stratejisi

  Aşamalı Geçiş (Önerilen):
  1. Pilot Şube (1 hafta): Tek bir şubede canlıya geç
  2. Gözlem ve İyileştirme (1 hafta): Sorunları tespit et ve düzelt
  3. Kademeli Yaygınlaştırma (2-4 hafta): Tüm şubelere yayılım

  5.3 Eğitim

  - Kullanıcı dokümantasyonu hazırlama
  - Video eğitim materyalleri
  - Personel eğitimi (kasiyer, yöneticiler)
  - Destek ekibi hazırlığı

  6. BAKIM VE İZLEME

  6.1 Monitoring (İzleme) Sistemi

  // Metrics toplama
  class EAdisyonMetrics {
    async gunlukIstatistikler() {
      return {
        toplam_belge: await this.toplamBelgeSayisi(),
        basarili: await this.basariliBelgeSayisi(),
        basarisiz: await this.basarisizBelgeSayisi(),
        bekleyen: await this.bekleyenBelgeSayisi(),
        ortalama_yanit_suresi: await this.ortalamaYanitSuresi()
      };
    }

    // Alarm sistemi
    async kontrolEt() {
      const basarisizOrani = await this.basarisizOrani();
      if (basarisizOrani > 0.05) { // %5'ten fazla başarısız
        await this.alarmGonder('Yüksek hata oranı tespit edildi!');
      }
    }
  }

  6.2 Log Yönetimi

  - Tüm API çağrılarını loglama
  - Hata logları ayrı dosyada tutma
  - Log rotation (eski logları arşivleme)
  - Minimum 5 yıl log saklama

  6.3 Düzenli Kontroller

  - Günlük: Başarısız belge kontrolü
  - Haftalık: Sistem performans analizi
  - Aylık: e-Arşiv rapor doğrulaması
  - Yıllık: Sertifika yenileme kontrolü

  7. MALİYET TAHMİNİ

  7.1 Yazılım Geliştirme

  - Geliştirici kaynağı: 8-12 hafta (1-2 developer)
  - Test ve QA: 2-3 hafta

  7.2 Altyapı Maliyetleri

  - Mali Mühür Sertifikası: ~2.000-5.000 TL/yıl
  - Özel Entegratör Ücreti: ~500-2.000 TL/ay (belge hacmine göre)
  - Zaman Damgası Servisi: Genelde entegratör paketinde
  - HSM (Opsiyonel): ~10.000-50.000 TL (tek seferlik)

  7.3 İşletme Maliyetleri

  - Teknik destek
  - Sistem bakımı
  - Sertifika yenileme

  8. RİSKLER VE ÖNLEMLER

  | Risk                             | Etki   | Önlem                            |
  |----------------------------------|--------|----------------------------------|
  | GİB sistem kesintisi             | Yüksek | Queue sistemi, offline mode      |
  | Sertifika süresi dolması         | Kritik | Otomatik uyarı sistemi           |
  | Yüksek belge hacminde performans | Orta   | Asenkron işleme, caching         |
  | Yasal değişiklikler              | Orta   | Modüler mimari, kolay güncelleme |
  | Veri kaybı                       | Kritik | Düzenli yedekleme, replikasyon   |

  9. ÖNERİLER

  9.1 Başlangıç için En İyi Yaklaşım

  Özel Entegratör kullanımı önerilir çünkü:
  - Hızlı entegrasyon (hazır SDK'lar)
  - Teknik destek mevcut
  - GİB ile iletişim entegratör üzerinden
  - Test ortamı kolayca sağlanır
  - Yasal güncellemeleri entegratör takip eder

  9.2 Teknoloji Stack Önerileri

  - Backend: Platform bağımlı (.NET Core, Java Spring, Node.js)
  - XML İşleme: Platform native kütüphaneleri
  - Queue: Redis veya RabbitMQ
  - Database: PostgreSQL veya SQL Server
  - Logging: ELK Stack veya Serilog
  - Monitoring: Prometheus + Grafana

  9.3 Güvenlik Önerileri

  - Sertifikaları şifreli saklama
  - API anahtarlarını environment variables'da tutma
  - HTTPS zorunlu kullanım
  - IP whitelist (GİB API için)
  - Rate limiting implementasyonu

  10. SONUÇ VE ZAMAN ÇİZELGESİ

  Toplam Süre: 10-14 Hafta

  Hafta 1-2   : Altyapı + Veritabanı
  Hafta 3-5   : XML Oluşturma + Validation
  Hafta 6-7   : Mali Mühür + İmzalama
  Hafta 8-10  : GİB API Entegrasyonu
  Hafta 11    : UI Geliştirme
  Hafta 12    : Hata Yönetimi + Queue
  Hafta 13    : e-Arşiv Raporlama
  Hafta 14    : Test + UAT
  Hafta 15-16 : Pilot + Canlıya Geçiş

  ---
  KAYNAKLAR

  Sources:
  - https://ynokc.gib.gov.tr/UploadedFiles/Files/yn-okc-fis-ve-e-belge-formatlari-kilavuz_taslak_16122025.pdf
  - https://www.edmbilisim.com.tr/uploads/EditorDosya/e-Arsiv_Teknik_Kilavuzu_V.1.18.pdf
  - https://mysoftebelge.com/e-adisyon
  - https://www.verginet.net/Dokumanlar/2021/e-Adisyon-Belgesi-Teknik-Kilavuzu-V1-0.pdf
  - https://sovos.com/tr/blog/kdv/e-adisyon-donemi-basliyor-beklenen-kilavuz-yayimlandi/
  - https://www.turmob.org.tr/mevzuat/Detay/19539/-e-adisyon-belgesi-teknik-kilavuzu-v1-0-pdf

⏺ POS uygulamanıza e-Adisyon desteği eklemek için kapsamlı planı hazırladım.

  Plan 10 ana bölümden oluşuyor:
  - Yasal gereksinimler ve e-Adisyon sisteminin ne olduğu
  - Teknik mimari ve sistem tasarımı
  - 7 fazlı geliştirme süreci (10-14 hafta)
  - Test stratejisi ve senaryoları
  - Canlıya geçiş planı
  - Bakım ve izleme yaklaşımı
  - Maliyet tahminleri
  - Risk analizi

  Önemli noktalar:
  1. Başlangıç için özel entegratör öneriyorum (İziBiz, Foriba, Sovos gibi) - daha hızlı ve destekli
  2. Queue sistemi kritik - internet kesilse bile belgeleri saklamalı
  3. Mali Mühür ve zaman damgası zorunlu
  4. 5 yıl saklama yükümlülüğü var

  Planı uygulamaya başlamadan önce şunları netleştirmeliyiz:
  - Mevcut POS uygulamanızın teknoloji stack'i nedir? (.NET, Java, Node.js vb.)
  - Hangi entegrasyon yöntemini tercih edersiniz? (Özel entegratör vs Doğrudan)
  - Kaç şube/lokasyon var?
  - Günlük ortalama adisyon sayısı nedir?

  Bu bilgilerle planı daha spesifik hale getirebilirim.
