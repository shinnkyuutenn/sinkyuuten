// ライブラリとコンポーネントのインポート
import { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

// 画像とアイコンのインポート
import heroImg from './assets/images/ui/Top Banner.jpg';
import mumbaiImg from './assets/images/ui/Mumbai.jpg';
import hyderabadImg from './assets/images/ui/Hyderabad.jpg';
import delhiImg from './assets/images/ui/New Delhi.jpg';
import signupBg from './assets/images/ui/signup_bg.jpg';
import spiceBg from './assets/images/ui/spice_bg.jpg';
import cleanlinessBg from './assets/images/ui/cleanliness_bg.jpg';
import comfortBg from './assets/images/ui/comfort_bg.jpg';
import crowdBg from './assets/images/ui/crowd_bg.jpg';
import searchIcon from './assets/icons/search_icon.png';
import lockIcon from './assets/icons/lock_icon_1.png';
import homeIcon from './assets/icons/home_icon_3.png';
import mapIcon from './assets/icons/map_icon_3.png';
import favoriteIcon from './assets/icons/favorite_icon_4.png';
import profileIcon from './assets/icons/profile_icon_3.png';
import spiceIcon from './assets/icons/spice_icon_1.png';
import spiceIconActive from './assets/icons/spice_icon_2.png';
import cleanlinessIcon from './assets/icons/cleanliness_icon_1.png';
import cleanlinessIconActive from './assets/icons/cleanliness_icon_2.png';
import comfortIcon from './assets/icons/comfort_icon_1.png';
import comfortIconActive from './assets/icons/comfort_icon_2.png';
import crowdIcon from './assets/icons/crowd_icon_1.png';
import crowdIconActive from './assets/icons/crowd_icon_2.png';
import spiceIconDetail from './assets/icons/spice_icon_3.png';
import cleanlinessIconDetail from './assets/icons/cleanliness_icon_3.png';
import comfortIconDetail from './assets/icons/comfort_icon_3.png';
import crowdIconDetail from './assets/icons/crowd_icon_3.png';
import restaurantIcon from './assets/icons/restaurant_icon_1.png';
import hotelIcon from './assets/icons/hotel_icon_1.png';
import spotIcon from './assets/icons/spot_icon_1.png';
import tripadvisorIcon from './assets/icons/tripadvisor_icon_1.png';

// 都市カード
const cityCards = [
  { id: 'mumbai', title: 'Mumbai', image: mumbaiImg },
  { id: 'hyderabad', title: 'Hyderabad', image: delhiImg },
];

// ロックされたセクション
const lockedSections = [
  { id: 'personal', title: 'おすすめの場所' },
  { id: 'latest', title: '感性が口コミ' },
  { id: 'article', title: '自作記事' },
];

// メニュー
const menuItems = [
  { id: 'home', label: 'ホーム', icon: homeIcon },
  { id: 'map', label: 'マップ', icon: mapIcon },
  { id: 'favorites', label: 'お気に入り', icon: favoriteIcon },
  { id: 'profile', label: '個人情報', icon: profileIcon },
];

// フィルターカテゴリ
const filterCategories = [
  { id: 'spiciness', label: '辛さ', icon: spiceIcon, activeIcon: spiceIconActive, max: 5 },
  { id: 'cleanliness', label: '清潔度', icon: cleanlinessIcon, activeIcon: cleanlinessIconActive, max: 5 },
  { id: 'comfort', label: '快適度', icon: comfortIcon, activeIcon: comfortIconActive, max: 5 },
  { id: 'crowd', label: '混雑度', icon: crowdIcon, activeIcon: crowdIconActive, max: 5 },
];

// スポット種別
const placeTypes = [
  { id: 'restaurant', label: '飲食店', icon: restaurantIcon },
  { id: 'hotel', label: 'ホテル', icon: hotelIcon },
  { id: 'spot', label: 'スポット', icon: spotIcon },
];

// 都市一覧
const cities = [
  { id: 'hyderabad', name: 'ハイデラバード' },
  { id: 'mumbai', name: 'ムンバイ' },
  { id: 'delhi', name: 'ニューデリー' },
];

// 都市の座標
const cityLocations = {
  hyderabad: { lat: 17.385044, lng: 78.486671 },
  mumbai: { lat: 19.076090, lng: 72.877426 },
  delhi: { lat: 28.613939, lng: 77.209021 },
};

// API ベース URL
// 開発時は同一オリジン（Vite proxy 経由）にして LAN/モバイルでも安定させる
// 本番では VITE_API_BASE_URL を設定する
const API_BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || '');

// city_id から座標を取得するヘルパー
const getCityCoordinates = (cityId) => {
  // city_id が不明な場合は Hyderabad をデフォルトにする
  return cityLocations[cityId] || cityLocations.hyderabad;
};

function KeywordPicker({ keyword, setKeyword, availableKeywords, selectedKeywords, setSelectedKeywords }) {
  const suggestions = useMemo(() => {
    const q = (keyword || '').trim();
    if (!q) return [];
    const lower = q.toLowerCase();
    return (availableKeywords || [])
      .filter((k) => !selectedKeywords?.includes(k))
      .filter((k) => k.toLowerCase().includes(lower))
      .slice(0, 8);
  }, [keyword, availableKeywords, selectedKeywords]);

  const addKeyword = (kw) => {
    const v = (kw || '').trim();
    if (!v) return;
    setSelectedKeywords((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      return arr.includes(v) ? arr : [...arr, v];
    });
    setKeyword('');
  };

  return (
    <div className="relative">
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addKeyword(keyword);
          }
        }}
        className="w-full px-4 py-3 rounded-xl bg-violet-50 border-none focus:outline-none focus:ring-2 focus:ring-violet-300 text-sm"
        placeholder="キーワードを入力（Enterで追加）"
      />

      {suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-20">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addKeyword(s)}
              className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-gray-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------
// 写真 URL ヘルパー
// ----------------------------
const normalizePhotoUrl = (url) => {
  if (!url) return '';
  let u = url.trim();
  // Google 画像 URL が http の場合は https に寄せる
  if (u.startsWith('http://lh3.googleusercontent.com')) {
    u = u.replace('http://', 'https://');
  }
  return u;
};

const parsePhotoUrls = (photoUrl) => {
  if (!photoUrl || typeof photoUrl !== 'string') return [];
  // カンマ区切り URL
  const urls = photoUrl
    .split(',')
    .map((s) => normalizePhotoUrl(s))
    .filter(Boolean)
    // ダミー URL を除外
    .filter((u) => !u.includes('example.com'));
  // 順序を維持して重複排除
  return Array.from(new Set(urls));
};

// フィルターパネルコンポーネント
function FilterPanel({ isOpen, onClose, filters, onFilterChange, selectedCity, onCitySelect, isCitySelectOpen, setIsCitySelectOpen, selectedTypes, setSelectedTypes, keyword, setKeyword, availableKeywords, selectedKeywords, setSelectedKeywords, onSearch }) {
  if (!isOpen) return null;

  // フィルター項目のレンダリング
  const renderFilterItem = (category) => {
    const isActive = filters[category.id] > 0;
    return (
      <div className={`flex-1 rounded-lg p-3 flex flex-col gap-2 transition-colors ${isActive ? 'bg-violet-500' : 'bg-gray-200'}`}>
        <div className="flex items-center gap-2">
          <img src={isActive ? category.activeIcon : category.icon} alt={category.label} className="h-5 w-5 object-contain" />
          <span className={`text-xs transition-colors ${isActive ? 'text-white' : 'text-gray-600'}`}>{category.label}</span>
          <span className={`font-medium text-lg transition-colors ml-auto ${isActive ? 'text-white' : 'text-gray-600'}`}>{filters[category.id]}</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max={category.max} 
          value={filters[category.id]} 
          onChange={(e) => onFilterChange(category.id, parseInt(e.target.value))} 
          className="w-full" 
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl w-full max-w-md p-6 space-y-6 shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors" 
          aria-label="閉じる"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4L16 16M16 4L4 16" />
          </svg>
        </button>
        <h2 className="text-center font-bold text-base text-slate-900">辛さ、清潔度、快適度、混雑度から探す</h2>

        <div className="space-y-3">
          {filterCategories.map((category, index) => {
            if (index % 2 === 0) {
              const nextCategory = filterCategories[index + 1];
              return (
                <div key={category.id} className="flex gap-3">
                  {renderFilterItem(category)}
                  {nextCategory && renderFilterItem(nextCategory)}
                </div>
              );
            }
            return null;
          })}
        </div>

        <div className="relative">
          <button onClick={() => setIsCitySelectOpen(!isCitySelectOpen)} className={`w-full rounded-lg py-3 px-5 font-medium text-center text-sm transition-colors ${selectedCity ? 'bg-violet-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
            {selectedCity ? selectedCity.name : '都市'}
          </button>
          {isCitySelectOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10">
              {cities.map((city) => (
                <button key={city.id} onClick={() => onCitySelect(city)} className={`w-full py-3 px-5 text-sm text-left transition-colors ${selectedCity?.id === city.id ? 'bg-violet-100 text-violet-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                  {city.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {placeTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setSelectedTypes((prev) => {
                  const arr = Array.isArray(prev) ? prev : [];
                  return arr.includes(type.id) ? arr.filter((t) => t !== type.id) : [...arr, type.id];
                });
              }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 px-4 transition-colors ${
                selectedTypes?.includes(type.id) ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <img src={type.icon} alt={type.label} className={`h-4 w-4 ${selectedTypes?.includes(type.id) ? 'brightness-0 invert' : ''}`} />
              <span className="text-xs font-medium">{type.label}</span>
            </button>
          ))}
        </div>

        {/* キーワード（追加） */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-900">キーワード</p>

          {/* selected chips */}
          {selectedKeywords?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedKeywords.map((kw) => (
                <span key={kw} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200">
                  {kw}
                  <button
                    type="button"
                    aria-label="remove keyword"
                    onClick={() => setSelectedKeywords((prev) => prev.filter((x) => x !== kw))}
                    className="text-violet-700/70 hover:text-violet-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <KeywordPicker
            keyword={keyword}
            setKeyword={setKeyword}
            availableKeywords={availableKeywords}
            selectedKeywords={selectedKeywords}
            setSelectedKeywords={setSelectedKeywords}
          />

          {/* keywords quick pick */}
          {Array.isArray(availableKeywords) && availableKeywords.length > 0 && (
            <div className="pt-1">
              <p className="text-xs font-medium text-slate-500 mb-2">キーワードを選ぶ</p>
              {/* show at most two lines */}
              <div className="flex flex-wrap gap-2 max-h-[72px] overflow-hidden">
                {availableKeywords.slice(0, 40).map((kw) => {
                  const active = selectedKeywords?.includes(kw);
                  return (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => {
                        setSelectedKeywords((prev) => {
                          const arr = Array.isArray(prev) ? prev : [];
                          return arr.includes(kw) ? arr.filter((x) => x !== kw) : [...arr, kw];
                        });
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        active
                          ? 'bg-violet-500 text-white border-violet-500'
                          : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {kw}
                    </button>
                  );
                })}
              </div>
              {availableKeywords.length > 40 && (
                <p className="mt-2 text-[11px] text-slate-500">上位 40 件を対象にしています（表示は2行まで・入力で絞り込みできます）</p>
              )}
            </div>
          )}
        </div>

        <button onClick={() => { onSearch && onSearch(); onClose(); }} className="w-full bg-violet-500 text-white font-semibold py-3 rounded-full shadow-lg hover:bg-violet-600 transition-colors">
          お店を検索する
        </button>
      </div>
    </div>
  );
}

// サイドメニューコンポーネント
function SideMenu({ isOpen, onClose, onNavigate, isLoggedIn, onLogout, isAdmin }) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />}
      <div className={`fixed top-0 right-0 h-full w-64 bg-violet-400/95 backdrop-blur-sm shadow-2xl z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{ borderTopLeftRadius: '24px', borderBottomLeftRadius: '24px' }}>
        <button onClick={onClose} className="absolute top-6 right-6 text-white hover:bg-white/20 rounded-full p-2 transition-colors" aria-label="閉じる">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4L16 16M16 4L4 16" />
          </svg>
        </button>
        <nav className="pt-20 px-6 pb-6 flex flex-col h-full">
          <ul className="space-y-1 flex-1">
            {menuItems.map((item, index) => (
              <li key={item.id}>
                <button onClick={() => onNavigate(item.id)} className="w-full flex items-center gap-4 text-white py-4 px-2 hover:bg-white/10 rounded-lg transition-colors">
                  <img src={item.icon} alt={item.label} className="h-6 w-6" />
                  <span className="text-base font-medium">{item.label}</span>
                </button>
                {index < menuItems.length - 1 && <div className="h-px bg-white/30 my-1" />}
              </li>
            ))}
            {isAdmin && (
              <>
                <div className="h-px bg-white/30 my-1" />
                <li>
                  <button onClick={() => onNavigate('add-pin')} className="w-full flex items-center gap-4 text-white py-4 px-2 hover:bg-white/10 rounded-lg transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="text-base font-medium">ピン追加</span>
                  </button>
                </li>
              </>
            )}
          </ul>
          {isLoggedIn && (
            <div className="pt-4 border-t border-white/30">
              <button 
                onClick={() => { onLogout(); onClose(); }} 
                className="w-full flex items-center gap-4 text-white py-4 px-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="text-base font-medium">ログアウト</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </>
  );
}

function App() {
  // Google Maps API読み込み
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyCf_VRFHEmNuNbfalEifqsiVwJ21sasdtg',
    language: 'ja',
  });

  // Google Maps 読み込みエラー監視
  useEffect(() => {
    if (loadError) {
      console.error('Google Maps加载错误:', loadError);
    }
  }, [loadError]);

  // ページ状態
  const [currentPage, setCurrentPage] = useState('home');
  const [previousPage, setPreviousPage] = useState('home');
  
  // 地図状態
  const [mapLocation, setMapLocation] = useState({ lat: 17.385044, lng: 78.486671 });
  const mapRef = useRef(null);
  
  // UI 状態
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCitySelectOpen, setIsCitySelectOpen] = useState(false);
  const [isUrlSubmitOpen, setIsUrlSubmitOpen] = useState(false);
  
  // フィルター状態
  const [restaurantUrl, setRestaurantUrl] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]); // 未選択可・複数選択可
  const [selectedCity, setSelectedCity] = useState(null);
  const [filters, setFilters] = useState({
    spiciness: 0,
    cleanliness: 0,
    comfort: 0,
    crowd: 0,
  });
  
  // 検索状態
  const [keyword, setKeyword] = useState('');
  const [shops, setShops] = useState([]);
  // レストランデータ（キーワード候補生成にも使うため先に宣言）
  const [restaurants, setRestaurants] = useState([]);
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [dbKeywords, setDbKeywords] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchSort, setSearchSort] = useState({ by: 'rating', dir: 'desc' });
  const [lastSearchQuery, setLastSearchQuery] = useState(null);
  const availableKeywords = useMemo(() => {
    const set = new Set();
    for (const r of restaurants || []) {
      if (Array.isArray(r.keywords)) {
        for (const k of r.keywords) set.add(k);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [restaurants]);

  const keywordOptions = useMemo(() => {
    // キーワードの出現店舗数で降順ソート（店舗データ `restaurants` を反映）
    const freq = new Map();
    for (const r of restaurants || []) {
      const kws = Array.isArray(r.keywords) ? r.keywords : [];
      const uniq = new Set(kws.filter(Boolean));
      for (const kw of uniq) {
        freq.set(kw, (freq.get(kw) || 0) + 1);
      }
    }

    const byFreq = Array.from(freq.entries())
      .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
      .map(([kw]) => kw);

    if (byFreq.length > 0) return byFreq;

    // 代替：restaurants 未取得の間は DB キーワード（あれば）→導出キーワードを使う
    const list = Array.isArray(dbKeywords) && dbKeywords.length > 0 ? dbKeywords : availableKeywords;
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
  }, [restaurants, dbKeywords, availableKeywords]);
  
  // ユーザー状態
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  // 管理者判定（email が 'seika' の場合）
  const isAdmin = useMemo(() => {
    return isLoggedIn && currentUser && currentUser.email === 'seika';
  }, [isLoggedIn, currentUser]);
  const [userPreferences, setUserPreferences] = useState({
    spiceTolerance: null,
    cleanliness: null,
    comfort: null,
    crowd: null,
  });
  
  // ピン追加フォーム状態
  const [pinForm, setPinForm] = useState({
    name: '',
    shop_type: '',
    city_id: '',
    latitude: '',
    longitude: '',
    spicy_level: 1,  // デフォルト1（データベース制約: 1-5）
    clean_level: 1,  // デフォルト1（データベース制約: 1-5）
    comfortable_level: 1,  // デフォルト1（データベース制約: 1-5）
    congestion_level: 1,  // デフォルト1（データベース制約: 1-5）
    avg_rating: 0,  // 平均評価（0-5の範囲、デフォルト0）
    photo_urls: ['', '', ''],
    keywords: ['', '', '', ''],
    source_url: '',
  });
  
  // URLリスト状態
  const [pendingUrls, setPendingUrls] = useState([]);
  const [isLoadingUrls, setIsLoadingUrls] = useState(false);
  const [selectedUrlId, setSelectedUrlId] = useState(null);
  
  // ログインフォーム状態
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // 登録フォーム状態
  const [signupForm, setSignupForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [signupError, setSignupError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  
  // お気に入り状態
  const [favoriteShopIds, setFavoriteShopIds] = useState(new Set());
  const [favoriteShops, setFavoriteShops] = useState([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  
  // レストランデータ状態
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);
  const [restaurantsError, setRestaurantsError] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const selectedRestaurantPhotoUrls = useMemo(
    () => parsePhotoUrls(selectedRestaurant?.photo_url),
    [selectedRestaurant?.photo_url]
  );
  const photoCarouselRef = useRef(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const carouselPointerDownRef = useRef(false);
  const carouselPointerIdRef = useRef(null);
  const carouselStartXRef = useRef(0);
  const carouselStartScrollLeftRef = useRef(0);
  // 旧：スクロールバー自動表示用の state/ref（現在はスクロールバー非表示に統一したため削除）
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    name: '',
    text: '',
    spicy: '',
    clean: '',
    comfort: '',
    crowd: '',
    avg_rating: '',
  });
  const [reviewsByShopId, setReviewsByShopId] = useState(() => {
    try {
      const raw = localStorage.getItem('reviewsByShopId');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('reviewsByShopId', JSON.stringify(reviewsByShopId));
    } catch {
      // 例外は無視
    }
  }, [reviewsByShopId]);

  useEffect(() => {
    setActivePhotoIndex(0);
    // 店変更時に先頭へ戻す
    if (photoCarouselRef.current) {
      photoCarouselRef.current.scrollLeft = 0;
    }
  }, [selectedRestaurant?.id]);

  useEffect(() => {
    // 写真枚数が変わった場合にインデックスを丸める
    if (activePhotoIndex > selectedRestaurantPhotoUrls.length - 1) {
      setActivePhotoIndex(Math.max(0, selectedRestaurantPhotoUrls.length - 1));
    }
  }, [activePhotoIndex, selectedRestaurantPhotoUrls.length]);

  const scrollToPhotoIndex = (idx) => {
    const el = photoCarouselRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(idx, selectedRestaurantPhotoUrls.length - 1));
    const width = el.clientWidth || 0;
    el.scrollTo({ left: width * clamped, behavior: 'smooth' });
  };

  const focusShopOnMap = (shop) => {
    const latRaw = shop?.latitude ?? shop?.position?.lat;
    const lngRaw = shop?.longitude ?? shop?.position?.lng;
    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const target = { lat, lng };
    setMapLocation(target);
    try {
      mapRef.current?.panTo?.(target);
    } catch {
      // 例外は無視
    }
  };

  const onCarouselPointerDown = (e) => {
    const el = photoCarouselRef.current;
    if (!el) return;
    // タッチはネイティブの横スクロール（慣性）を優先。マウスのみドラッグ実装。
    if (e.pointerType !== 'mouse') return;
    // 左クリックのみ
    if (e.button !== 0) return;
    carouselPointerDownRef.current = true;
    carouselPointerIdRef.current = e.pointerId;
    carouselStartXRef.current = e.clientX;
    carouselStartScrollLeftRef.current = el.scrollLeft;
    // ドラッグ中は snap を切り、離した時に吸着させる
    try {
      el.style.scrollSnapType = 'none';
    } catch {
      // 例外は無視
    }
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // 例外は無視
    }
  };

  const onCarouselPointerMove = (e) => {
    const el = photoCarouselRef.current;
    if (!el || !carouselPointerDownRef.current) return;
    const dx = e.clientX - carouselStartXRef.current;
    // ドラッグを軽く感じさせるため移動量を少し増幅
    const DRAG_SPEED = 1.35;
    el.scrollLeft = carouselStartScrollLeftRef.current - dx * DRAG_SPEED;
    try {
      e.preventDefault();
    } catch {
      // 例外は無視
    }
  };

  const onCarouselPointerUpOrCancel = (e) => {
    const el = photoCarouselRef.current;
    if (!el || !carouselPointerDownRef.current) return;
    if (carouselPointerIdRef.current != null) {
      try {
        el.releasePointerCapture(carouselPointerIdRef.current);
      } catch {
        // 例外は無視
      }
    }
    carouselPointerDownRef.current = false;
    carouselPointerIdRef.current = null;
    // snap を復帰
    try {
      el.style.scrollSnapType = '';
    } catch {
      // 例外は無視
    }
    // 最も近い画像へ吸着
    if (el.clientWidth) {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      scrollToPhotoIndex(idx);
    }
  };
  // （削除）旧スクロールバー自動表示ロジック

  const openDetailPage = () => {
    if (!selectedRestaurant) return;
    setPreviousPage(currentPage);
    setCurrentPage('detail');
  };

  const closeDetailPage = () => {
    setIsWriteReviewOpen(false);
    setReviewForm({ name: '', text: '', spicy: '', clean: '', comfort: '', crowd: '', avg_rating: '' });
    // 詳細を閉じ、下部の詳細カードも閉じる
    setSelectedRestaurant(null);
    setCurrentPage('map');
  };

  const isDetailOpen = currentPage === 'detail' && !!selectedRestaurant;
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearchSortClick = (by) => {
    const active = searchSort.by === by;
    const next = active
      ? { by, dir: searchSort.dir === 'asc' ? 'desc' : 'asc' }
      : { by, dir: by === 'crowd' ? 'asc' : 'desc' };
    setSearchSort(next);
    searchShops(next, lastSearchQuery || undefined);
  };

  const currentReviews = useMemo(() => {
    const key = selectedRestaurant?.id;
    if (!key) return [];
    return Array.isArray(reviewsByShopId[key]) ? reviewsByShopId[key] : [];
  }, [reviewsByShopId, selectedRestaurant?.id]);

  const submitReview = () => {
    if (!selectedRestaurant) return;
    const name = (reviewForm.name || '').trim() || 'ゲスト';
    const text = (reviewForm.text || '').trim();
    const spicy = Number(reviewForm.spicy);
    const clean = Number(reviewForm.clean);
    const comfort = Number(reviewForm.comfort);
    const crowd = Number(reviewForm.crowd);
    const avg_rating = reviewForm.avg_rating !== '' ? Number(reviewForm.avg_rating) : null;
    if (!text) return;
    if (![spicy, clean, comfort, crowd].every((n) => Number.isFinite(n) && n >= 1 && n <= 5)) return;
    if (avg_rating !== null && (!Number.isFinite(avg_rating) || avg_rating < 0 || avg_rating > 5)) return;

    const entry = {
      id: `${Date.now()}`,
      name,
      text,
      createdAt: new Date().toISOString(),
      ratings: { spicy, clean, comfort, crowd },
      avg_rating: avg_rating,
    };

    setReviewsByShopId((prev) => {
      const shopId = selectedRestaurant.id;
      const nextList = [entry, ...(Array.isArray(prev[shopId]) ? prev[shopId] : [])];
      return { ...prev, [shopId]: nextList };
    });

    setIsWriteReviewOpen(false);
    setReviewForm({ name: '', text: '', spicy: '', clean: '', comfort: '', crowd: '', avg_rating: '' });
  };

  // お店検索（フィルターパネルの「検索」から呼ぶ）
   const searchShops = async (overrideSort, overrideQuery) => {
    try {
      setIsSearching(true);
      setSearchError(null);
      // console.debug('searchShops start', { keyword, selectedTypes, selectedCity, filters });
      const sort = overrideSort || searchSort;

      const q =
        overrideQuery ||
        {
          keyword: keyword || '',
          keywords: Array.isArray(selectedKeywords) ? selectedKeywords.join(',') : '',
          shop_type: Array.isArray(selectedTypes) ? selectedTypes.join(',') : '',
          city: selectedCity?.id || '',
          min_spicy: filters.spiciness || 0,
          min_clean: filters.cleanliness || 0,
          min_comfort: filters.comfort || 0,
          min_congestion: filters.crowd || 0,
        };

      if (!overrideQuery) setLastSearchQuery(q);

      const params = new URLSearchParams({
        ...q,
        sort_by: sort.by,
        sort_dir: sort.dir,
      });

      // console.debug('searchShops url', `/search_shops_json?${params}`);
      // 開発時は同一オリジン（Vite proxy）で LAN/モバイルでも動作させる
      const res = await fetch(`/search_shops_json?${params}`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      setShops(data || []);
      setIsSearchOpen(true);
    } catch (e) {
      console.error('検索失敗', e);
      setShops([]);
      setSearchError('検索に失敗しました');
    } finally {
      setIsSearching(false);
    }
  };
  // データベースからレストランデータを取得
  useEffect(() => {
    const fetchRestaurants = async () => {
      setIsLoadingRestaurants(true);
      setRestaurantsError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/restaurants`);
        if (!response.ok) {
          throw new Error('データの取得に失敗しました');
        }
        const data = await response.json();

        // Neon/pg は NUMERIC を文字列で返すことがあるため数値へ正規化する
        // Google Maps の marker や表示整形が安定する
        const toNumberOrNull = (v) => {
          if (v === null || v === undefined || v === '') return null;
          const n = Number(v);
          return Number.isFinite(n) ? n : null;
        };

        // デバッグログは本番衛生のため削除
        const restaurantsWithPosition = data.map(restaurant => {
          // keywords は配列として必ず保持（なければ空配列）
          const keywords = (restaurant.keywords && Array.isArray(restaurant.keywords)) ? restaurant.keywords : [];

          const latitude = toNumberOrNull(restaurant.latitude);
          const longitude = toNumberOrNull(restaurant.longitude);
          const avgRating = toNumberOrNull(restaurant.avg_rating);

          const result = {
            ...restaurant,
            // 数値系フィールドを正規化
            spicy_level: toNumberOrNull(restaurant.spicy_level),
            clean_level: toNumberOrNull(restaurant.clean_level),
            comfortable_level: toNumberOrNull(restaurant.comfortable_level),
            congestion_level: toNumberOrNull(restaurant.congestion_level),
            avg_rating: avgRating,
            latitude,
            longitude,
            position: restaurant.latitude && restaurant.longitude 
              ? { lat: latitude ?? getCityCoordinates(restaurant.city_id).lat, lng: longitude ?? getCityCoordinates(restaurant.city_id).lng }
              : getCityCoordinates(restaurant.city_id),
            keywords: keywords, // keywords は配列として扱う
          };
          return result;
        });
        setRestaurants(restaurantsWithPosition);
      } catch (error) {
        console.error('レストランデータ取得エラー:', error);
        setRestaurantsError(error.message);
        setRestaurants([]);
      } finally {
        setIsLoadingRestaurants(false);
      }
    };

    // マップページ/ホーム/詳細（地図上のオーバーレイ）でデータを取得
    if (currentPage === 'map' || currentPage === 'home' || currentPage === 'detail') {
      fetchRestaurants();
    }
  }, [currentPage]);

  // フィルター変更
  const handleFilterChange = (id, value) => setFilters(prev => ({ ...prev, [id]: value }));
  
  // 都市選択
  const handleCitySelect = (city) => { setSelectedCity(city); setIsCitySelectOpen(false); };
  
  // フィルターリセット
  const resetFilters = () => {
    setFilters({ spiciness: 0, cleanliness: 0, comfort: 0, crowd: 0 });
    setSelectedCity(null);
    setSelectedTypes([]); // 未選択へリセット
    setKeyword('');
    setSelectedKeywords([]);
    setIsCitySelectOpen(false);
  };

  // マップ関連状態リセット（マップ → ホーム遷移時）
  const resetMapPageState = () => {
    // UI オーバーレイ/パネルを閉じる
    setIsMenuOpen(false);
    setIsFilterOpen(false);
    setIsUrlSubmitOpen(false);
    setIsCitySelectOpen(false);
    setIsWriteReviewOpen(false);

    // 選択/検索結果をクリア
    setSelectedRestaurant(null);
    setIsSearchOpen(false);
    setShops([]);
    setSearchError(null);
    setIsSearching(false);
    setLastSearchQuery(null);
    setSearchSort({ by: 'rating', dir: 'desc' });

    // フィルター入力をリセット
    resetFilters();

    // 地図中心をデフォルトへ
    setMapLocation({ lat: 17.385044, lng: 78.486671 });
  };

  // マップページからホームへ戻る時に、マップページの状態をリセット
  const lastPageRef = useRef(currentPage);
  useEffect(() => {
    const prev = lastPageRef.current;
    if ((prev === 'map' || prev === 'detail') && currentPage === 'home') {
      resetMapPageState();
    }
    lastPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    // DB のキーワード一覧を取得（Node API 経由）
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/keywords`);
        if (!res.ok) return;
        const rows = await res.json();
        const words = (Array.isArray(rows) ? rows : [])
          .map((r) => r?.word)
          .filter((w) => typeof w === 'string' && w.trim())
          .map((w) => w.trim());
        setDbKeywords(words);
    } catch {
      // 例外は無視
      }
    };
    load();
  }, []);
  
  // フィルターパネル閉じる：状態をクリア
  const handleCloseFilter = () => { setIsFilterOpen(false); resetFilters(); };
  
  // メニューナビゲーション
  const handleMenuNavigate = (pageId) => {
    if (pageId === 'home' || pageId === 'map') {
      setCurrentPage(pageId);
    } else if (pageId === 'favorites') {
      if (!isLoggedIn) {
        setPreviousPage(currentPage);
        setCurrentPage('login');
      } else {
        setCurrentPage('favorites');
      }
    } else if (pageId === 'profile' && !isLoggedIn) {
      setPreviousPage(currentPage);
      setCurrentPage('login');
    } else if (pageId === 'add-pin') {
      // ピン追加ページ（管理者のみメニューからアクセス可能）
      if (isAdmin) {
        setSelectedUrlId(null); // URLリストに戻る
        setCurrentPage('add-pin');
      } else {
        // 一般ユーザーはアクセス不可
        alert('この機能は管理者専用です');
      }
    }
    setIsMenuOpen(false);
  };
  
  // 現在の都市取得
  const getCurrentCity = () => {
    if (Math.abs(mapLocation.lat - 17.385044) < 0.01) return 'Hyderabad';
    if (Math.abs(mapLocation.lat - 19.076090) < 0.01) return 'Mumbai';
    return 'Hyderabad';
  };
  
  // ログイン状態チェック
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const res = await fetch('/auth/me_json', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.logged_in) {
            setIsLoggedIn(true);
            setCurrentUser(data.user);
          }
        }
      } catch (error) {
        console.error('ログイン状態確認エラー:', error);
      }
    };
    checkLoginStatus();
  }, []);

  // ページ切り替え時にログイン/登録フォームをクリア
  useEffect(() => {
    if (currentPage !== 'login' && currentPage !== 'signup') {
      // ログインページから離れた時
      setLoginForm({ email: '', password: '' });
      setLoginError('');
      // 登録ページから離れた時
      setSignupForm({ username: '', email: '', password: '', confirmPassword: '' });
      setUserPreferences({ spiceTolerance: null, cleanliness: null, comfort: null, crowd: null });
      setPasswordError('');
      setSignupError('');
    }
  }, [currentPage]);

  // ピン追加ページで未処理URLリストを取得（管理者がメニューからアクセスした場合のみ）
  useEffect(() => {
    if (currentPage === 'add-pin' && isAdmin && !selectedUrlId) {
      const loadPendingUrls = async () => {
        setIsLoadingUrls(true);
        try {
          const res = await fetch('/shop/pending_urls_json', {
            credentials: 'include',
          });
          if (res.ok) {
            const data = await res.json();
            if (data.ok && data.urls) {
              setPendingUrls(data.urls);
            }
          }
        } catch (error) {
          console.error('URL一覧取得エラー:', error);
        } finally {
          setIsLoadingUrls(false);
        }
      };
      loadPendingUrls();
    }
  }, [currentPage, isAdmin, selectedUrlId]);

  // ログイン送信
  const handleLoginSubmit = async () => {
    if (!loginForm.email || !loginForm.password) {
      setLoginError('メールアドレスとパスワードを入力してください');
      return;
    }
    
    setIsLoggingIn(true);
    setLoginError('');
    
    try {
      const formData = new FormData();
      formData.append('email', loginForm.email);
      formData.append('password', loginForm.password);
      
      const res = await fetch('/auth/login_json', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      const data = await res.json();
      
      if (data.ok) {
        setIsLoggedIn(true);
        setCurrentUser(data.user);
        setLoginForm({ email: '', password: '' });
        setCurrentPage(previousPage);
      } else {
        setLoginError(data.error || 'ログインに失敗しました');
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      setLoginError('ログインに失敗しました。もう一度お試しください。');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ログアウト
  const handleLogout = async () => {
    try {
      await fetch('/auth/logout_json', {
        method: 'POST',
        credentials: 'include',
      });
      setIsLoggedIn(false);
      setCurrentUser(null);
      setFavoriteShopIds(new Set());
      setFavoriteShops([]);
      setCurrentPage('home');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  // お気に入り状態を取得
  useEffect(() => {
    if (!isLoggedIn) {
      setFavoriteShopIds(new Set());
      setFavoriteShops([]);
      return;
    }

    const loadFavorites = async () => {
      setIsLoadingFavorites(true);
      try {
        const res = await fetch('/auth/favorites_json', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.favorites) {
            const ids = new Set(data.favorites.map((s) => s.id));
            setFavoriteShopIds(ids);
            setFavoriteShops(data.favorites);
          }
        }
      } catch (error) {
        console.error('お気に入り取得エラー:', error);
      } finally {
        setIsLoadingFavorites(false);
      }
    };

    loadFavorites();
  }, [isLoggedIn]);

  // お気に入りに追加/削除
  const toggleFavorite = async (shopId) => {
    if (!isLoggedIn) {
      setPreviousPage(currentPage);
      setCurrentPage('login');
      return;
    }

    const isFavorite = favoriteShopIds.has(shopId);
    const method = isFavorite ? 'DELETE' : 'POST';
    
    try {
      const res = await fetch('/auth/favorites_json', {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ shop_id: shopId }),
      });

      const data = await res.json();
      if (data.ok) {
        const newIds = new Set(favoriteShopIds);
        if (isFavorite) {
          newIds.delete(shopId);
          setFavoriteShops((prev) => prev.filter((s) => s.id !== shopId));
        } else {
          newIds.add(shopId);
          // 店舗情報を取得して追加（restaurants または selectedRestaurant から）
          const shop = restaurants.find((r) => r.id === shopId) || 
                       (selectedRestaurant && selectedRestaurant.id === shopId ? selectedRestaurant : null);
          if (shop) {
            setFavoriteShops((prev) => {
              // 既に存在する場合は追加しない
              if (prev.find((s) => s.id === shopId)) return prev;
              return [...prev, shop];
            });
          } else {
            // 店舗情報が見つからない場合は、お気に入り一覧を再取得
            const favRes = await fetch('/auth/favorites_json', {
              credentials: 'include',
            });
            if (favRes.ok) {
              const favData = await favRes.json();
              if (favData.ok && favData.favorites) {
                setFavoriteShops(favData.favorites);
              }
            }
          }
        }
        setFavoriteShopIds(newIds);
      } else {
        console.error('お気に入り操作エラー:', data.error);
      }
    } catch (error) {
      console.error('お気に入り操作エラー:', error);
    }
  };
  
  // パスワード変更
  const handlePasswordChange = (value) => {
    setSignupForm(prev => ({ ...prev, password: value }));
    if (signupForm.confirmPassword) {
      setPasswordError(value !== signupForm.confirmPassword ? 'パスワードが一致しません' : '');
    }
  };
  
  // パスワード確認変更
  const handleConfirmPasswordChange = (value) => {
    setSignupForm(prev => ({ ...prev, confirmPassword: value }));
    setPasswordError(value !== signupForm.password ? 'パスワードが一致しません' : '');
  };
  
  // 登録送信
  const handleSignupSubmit = async () => {
    if (signupForm.password !== signupForm.confirmPassword) {
      setPasswordError('パスワードが一致しません');
      return;
    }
    if (!signupForm.password) {
      setPasswordError('パスワードを入力してください');
      return;
    }
    if (!signupForm.username || signupForm.username.length < 3) {
      setSignupError('ユーザー名は3文字以上で入力してください');
      return;
    }
    if (!signupForm.email || !signupForm.email.includes('@')) {
      setSignupError('有効なメールアドレスを入力してください');
      return;
    }
    if (!userPreferences.spiceTolerance || !userPreferences.cleanliness || !userPreferences.comfort || !userPreferences.crowd) {
      setSignupError('すべての評価項目を選択してください');
      return;
    }
    
    setPasswordError('');
    setSignupError('');
    setIsSigningUp(true);
    
    try {
      const formData = new FormData();
      formData.append('name', signupForm.username);
      formData.append('email', signupForm.email);
      formData.append('password', signupForm.password);
      formData.append('spicy_level', String(userPreferences.spiceTolerance));
      formData.append('clean_level', String(userPreferences.cleanliness));
      formData.append('comfortable_level', String(userPreferences.comfort));
      formData.append('congestion_level', String(userPreferences.crowd));
      
      const res = await fetch('/auth/register_json', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        setSignupError(`サーバーエラー: レスポンスの解析に失敗しました (${res.status})`);
        return;
      }
      
      if (!res.ok || !data.ok) {
        setSignupError(data.error || `登録に失敗しました (HTTP ${res.status})`);
        return;
      }
      
      // 登録成功後、自動ログイン
      const loginFormData = new FormData();
      loginFormData.append('email', signupForm.email);
      loginFormData.append('password', signupForm.password);
      
      try {
        const loginRes = await fetch('/auth/login_json', {
          method: 'POST',
          credentials: 'include',
          body: loginFormData,
        });
        
        const loginData = await loginRes.json();
        if (loginData.ok) {
          setIsLoggedIn(true);
          setCurrentUser(loginData.user);
        } else {
          console.warn('自動ログインに失敗しましたが、登録は成功しました');
        }
      } catch (loginError) {
        console.error('自動ログインエラー:', loginError);
        // 登録は成功したので、エラーを表示しない
      }
      
      // フォームをリセット
      setSignupForm({ username: '', email: '', password: '', confirmPassword: '' });
      setUserPreferences({ spiceTolerance: null, cleanliness: null, comfort: null, crowd: null });
      setCurrentPage('home');
    } catch (error) {
      console.error('登録エラー:', error);
      setSignupError('登録に失敗しました。もう一度お試しください。');
    } finally {
      setIsSigningUp(false);
    }
  };

  // ログインページ
  if (currentPage === 'login') {
    return (
      <main className="bg-white font-inter text-slate-900 w-full overflow-x-hidden">
        <div className="mx-auto max-w-md w-full">
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <button onClick={() => {
              setLoginForm({ email: '', password: '' });
              setLoginError('');
              setCurrentPage(previousPage);
            }} className="p-2" aria-label="戻る">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="flex-1 text-center text-lg font-semibold text-slate-900">ログイン</h1>
            <div className="w-10"></div>
          </div>
          <div className="h-[29vh] bg-cover bg-center" style={{ backgroundImage: `url(${signupBg})` }} />
          <div className="px-8 pt-8 space-y-8">
            {loginError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm text-red-600">{loginError}</p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">メールアドレス</label>
              <input 
                type="email" 
                value={loginForm.email}
                onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-violet-50 border-none focus:outline-none focus:ring-2 focus:ring-violet-300" 
                placeholder="example@email.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">パスワード</label>
              <input 
                type="password" 
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-violet-50 border-none focus:outline-none focus:ring-2 focus:ring-violet-300" 
                placeholder="パスワードを入力"
              />
            </div>
            <div className="!mt-16">
              <button 
                onClick={handleLoginSubmit}
                disabled={isLoggingIn}
                className="w-full py-3 bg-violet-500 text-white font-semibold rounded-full shadow-lg hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? 'ログイン中...' : 'ログイン'}
              </button>
            </div>
            <div className="flex flex-col items-center space-y-3 pt-4 pb-12">
              <button onClick={() => setCurrentPage('signup')} className="text-sm text-violet-400 hover:text-violet-600">新規登録</button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 新規登録ページ
  if (currentPage === 'signup') {
    const PreferenceSelector = ({ title, bgImage, levels, prefKey }) => (
      <div className="space-y-3">
        <div className="relative rounded-xl bg-cover bg-center overflow-hidden" style={{ backgroundImage: `url(${bgImage})` }}>
          <div className="relative py-8">
            <h3 className="text-center text-2xl font-extrabold text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5), -1px -1px 2px rgba(0,0,0,0.3)' }}>{title}</h3>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between gap-2">
            {levels.buttons.map(({ level, color }) => (
              <button key={level} onClick={() => setUserPreferences(prev => ({ ...prev, [prefKey]: level }))} className={`flex-1 h-12 rounded-lg shadow-md flex items-center justify-center font-bold text-white text-base transition-all ${userPreferences[prefKey] === level ? color : 'bg-gray-300'}`}>{level}</button>
            ))}
          </div>
          <div className={`h-2 rounded-full ${levels.gradient}`}></div>
          <div className="flex justify-between text-[10px] text-slate-600 font-normal leading-tight">
            {levels.labels.map((label, i) => (
              <div key={i} className="w-1/5 text-center" dangerouslySetInnerHTML={{ __html: label }} />
            ))}
          </div>
        </div>
      </div>
    );

    return (
      <main className="bg-white font-inter text-slate-900 w-full overflow-x-hidden">
        <div className="mx-auto max-w-md min-h-screen w-full">
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <button onClick={() => {
              setSignupForm({ username: '', email: '', password: '', confirmPassword: '' });
              setUserPreferences({ spiceTolerance: null, cleanliness: null, comfort: null, crowd: null });
              setPasswordError('');
              setSignupError('');
              setCurrentPage('login');
            }} className="p-2" aria-label="戻る">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="flex-1 text-center text-lg font-semibold text-slate-900">新規登録</h1>
            <div className="w-10"></div>
          </div>
          <div className="px-8 py-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">ユーザー名</label>
              <input 
                type="text" 
                value={signupForm.username}
                onChange={(e) => setSignupForm(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-violet-50 border-none focus:outline-none focus:ring-2 focus:ring-violet-300" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">メールアドレス</label>
              <input 
                type="email" 
                value={signupForm.email}
                onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-violet-50 border-none focus:outline-none focus:ring-2 focus:ring-violet-300" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">パスワード</label>
              <input 
                type="password" 
                value={signupForm.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-violet-50 border-none focus:outline-none focus:ring-2 focus:ring-violet-300" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">パスワード確認</label>
              <input 
                type="password" 
                value={signupForm.confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-violet-50 border-none focus:outline-none focus:ring-2 ${
                  passwordError ? 'focus:ring-red-300' : 'focus:ring-violet-300'
                }`}
              />
              {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
            </div>
            
            <PreferenceSelector 
              title="あなたの辛さ耐性は？" 
              bgImage={spiceBg} 
              prefKey="spiceTolerance"
              levels={{
                buttons: [
                  { level: 1, color: 'bg-yellow-400' },
                  { level: 2, color: 'bg-orange-400' },
                  { level: 3, color: 'bg-orange-500' },
                  { level: 4, color: 'bg-red-500' },
                  { level: 5, color: 'bg-red-600' }
                ],
                gradient: 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600',
                labels: ['辛い無理<br/>0SHU', 'パプリカ程度<br/>300SHU', 'カイエン程度<br/>1500SHU', 'タバスコ程度<br/>5000SHU', '赤唐辛子程度<br/>25000SHU']
              }}
            />

            <PreferenceSelector 
              title="あなたの清潔重視度は？" 
              bgImage={cleanlinessBg} 
              prefKey="cleanliness"
              levels={{
                buttons: [
                  { level: 1, color: 'bg-cyan-300' },
                  { level: 2, color: 'bg-sky-400' },
                  { level: 3, color: 'bg-blue-500' },
                  { level: 4, color: 'bg-blue-600' },
                  { level: 5, color: 'bg-blue-700' }
                ],
                gradient: 'bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-700',
                labels: ['汚れてても平気', '気分次第で掃除', '清潔だと気持ちいい', '触れる所は拭きたい', '常にピカピカ必須']
              }}
            />

            <PreferenceSelector 
              title="あなたの快適さ重視度は？" 
              bgImage={comfortBg} 
              prefKey="comfort"
              levels={{
                buttons: [
                  { level: 1, color: 'bg-lime-400' },
                  { level: 2, color: 'bg-green-400' },
                  { level: 3, color: 'bg-green-500' },
                  { level: 4, color: 'bg-green-600' },
                  { level: 5, color: 'bg-green-700' }
                ],
                gradient: 'bg-gradient-to-r from-lime-400 via-green-500 to-green-700',
                labels: ['不便でも平気', '気分で整える', '快適だと嬉しい', '快適さは必須', '常に最適必須']
              }}
            />

            <PreferenceSelector 
              title="あなたの混雑苦手度は？" 
              bgImage={crowdBg} 
              prefKey="crowd"
              levels={{
                buttons: [
                  { level: 1, color: 'bg-amber-200' },
                  { level: 2, color: 'bg-amber-400' },
                  { level: 3, color: 'bg-yellow-600' },
                  { level: 4, color: 'bg-amber-700' },
                  { level: 5, color: 'bg-amber-900' }
                ],
                gradient: 'bg-gradient-to-r from-amber-200 via-yellow-600 to-amber-900',
                labels: ['混んでも平気', 'ちょい混みOK', '適度なら大丈夫', '人多いとしんどい', '混雑は無理']
              }}
            />

            {signupError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm text-red-600">{signupError}</p>
              </div>
            )}
            <div className="pt-6 pb-12">
              <button 
                onClick={handleSignupSubmit}
                disabled={isSigningUp}
                className="w-full py-3 bg-violet-500 text-white font-semibold rounded-full shadow-lg hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigningUp ? '登録中...' : 'ユーザー登録'}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // お気に入りページ
  if (currentPage === 'favorites') {
    return (
      <main className="min-h-screen bg-white font-inter text-slate-900 w-full overflow-x-hidden">
        <div className="mx-auto max-w-md w-full">
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <button onClick={() => setCurrentPage(previousPage)} className="p-2" aria-label="戻る">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="flex-1 text-center text-lg font-semibold text-slate-900">お気に入り</h1>
            <div className="w-10"></div>
          </div>

          <div className="px-6 py-4">
            {isLoadingFavorites ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-500">読み込み中...</p>
              </div>
            ) : favoriteShops.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <svg className="w-16 h-16 text-violet-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <p className="text-slate-500 text-sm">お気に入りがありません</p>
                <p className="text-slate-400 text-xs mt-2">気になる店舗を追加してみましょう</p>
              </div>
            ) : (
              <div className="space-y-4 pb-6">
                {favoriteShops.map((shop) => {
                  const photos = parsePhotoUrls(shop.photo_url).slice(0, 3);
                  return (
                    <button
                      key={shop.id}
                      type="button"
                      onClick={() => {
                        setSelectedRestaurant(shop);
                        setMapLocation({ lat: shop.latitude, lng: shop.longitude });
                        setCurrentPage('map');
                      }}
                      className="w-full text-left bg-white rounded-2xl shadow-[0_10px_25px_rgba(15,23,42,0.12)] border border-gray-100 overflow-hidden hover:shadow-[0_12px_30px_rgba(15,23,42,0.15)] transition-shadow"
                    >
                      <div className="p-4 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-base font-bold text-slate-900 truncate">{shop.name}</p>
                            <div className="flex items-center gap-1">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                              <span className="text-sm font-semibold text-slate-700">{Number(shop.avg_rating || 0).toFixed(1)}</span>
                            </div>
                          </div>
                          {Array.isArray(shop.keywords) && shop.keywords.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500">
                              {shop.keywords.slice(0, 4).map((k) => (
                                <span key={k}>{k}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          aria-label="お気に入りから削除"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(shop.id);
                          }}
                          className="shrink-0 rounded-full p-2 text-violet-500 bg-violet-50 hover:bg-violet-100 transition-colors"
                        >
                          <svg 
                            width="18" 
                            height="18" 
                            viewBox="0 0 24 24" 
                            fill="currentColor" 
                            stroke="currentColor" 
                            strokeWidth="2.2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                        </button>
                      </div>

                      <div className="px-4 pb-3">
                        <div className="grid grid-cols-3 gap-2">
                          {photos.length > 0 ? (
                            photos.map((u, idx) => (
                              <div key={`${u}-${idx}`} className="h-20 rounded-xl overflow-hidden bg-gray-100">
                                <img src={u} alt={`${shop.name}-${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                              </div>
                            ))
                          ) : (
                            <div className="col-span-3 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-slate-400">
                              no photo
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="px-4 pb-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">辛さレベル</span>
                            <span className="text-sm font-bold text-slate-900">{shop.spicy_level || 0}</span>
                          </div>
                          <div className="flex gap-1 w-[116px] justify-end">
                            {[1, 2, 3, 4, 5].map((lv) => (
                              <img key={lv} src={spiceIconDetail} alt="spicy" className={`w-5 h-5 object-contain ${lv <= (shop.spicy_level || 0) ? 'opacity-100' : 'opacity-25'}`} />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">清潔度</span>
                            <span className="text-sm font-bold text-slate-900">{shop.clean_level || 0}</span>
                          </div>
                          <div className="flex gap-1 w-[116px] justify-end">
                            {[1, 2, 3, 4, 5].map((lv) => (
                              <img key={lv} src={cleanlinessIconDetail} alt="cleanliness" className={`w-5 h-5 object-contain ${lv <= (shop.clean_level || 0) ? 'opacity-100' : 'opacity-25'}`} />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">快適度</span>
                            <span className="text-sm font-bold text-slate-900">{shop.comfortable_level || 0}</span>
                          </div>
                          <div className="flex gap-1 w-[116px] justify-end">
                            {[1, 2, 3, 4, 5].map((lv) => (
                              <img key={lv} src={comfortIconDetail} alt="comfort" className={`w-5 h-5 object-contain ${lv <= (shop.comfortable_level || 0) ? 'opacity-100' : 'opacity-25'}`} />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">混雑度</span>
                            <span className="text-sm font-bold text-slate-900">{shop.congestion_level || 0}</span>
                          </div>
                          <div className="flex gap-1 w-[116px] justify-end">
                            {[1, 2, 3, 4, 5].map((lv) => (
                              <img key={lv} src={crowdIconDetail} alt="crowd" className={`w-5 h-5 object-contain ${lv <= (shop.congestion_level || 0) ? 'opacity-100' : 'opacity-25'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ピン追加ページ（管理者専用、メニューからアクセス）
  if (currentPage === 'add-pin') {
    // 管理者チェック
    if (!isAdmin) {
      // 管理者でない場合は地図ページに戻る
      setCurrentPage('map');
      return null;
    }
    
    // URL選択ハンドラー
    const handleSelectUrl = (urlData) => {
      setSelectedUrlId(urlData.id);
      setPinForm(prev => ({
        ...prev,
        source_url: urlData.url,
      }));
      // submittedByUserIdをsessionStorageに保存
      if (urlData.submitted_by_user_id) {
        sessionStorage.setItem('submittedByUserId', urlData.submitted_by_user_id.toString());
      }
    };
    
    // URLリストに戻る
    const handleBackToUrlList = () => {
      setSelectedUrlId(null);
      setPinForm({
        name: '',
        shop_type: '',
        city_id: '',
        latitude: '',
        longitude: '',
        spicy_level: 1,  // デフォルト1（データベース制約: 1-5）
        clean_level: 1,  // デフォルト1（データベース制約: 1-5）
        comfortable_level: 1,  // デフォルト1（データベース制約: 1-5）
        congestion_level: 1,  // デフォルト1（データベース制約: 1-5）
        avg_rating: 0,  // 平均評価（0-5の範囲、デフォルト0）
        photo_urls: ['', '', ''],
        keywords: ['', '', '', ''],
        source_url: '',
      });
      sessionStorage.removeItem('submittedByUserId');
    };
    
    const handleSubmitPin = async () => {
      // ログインチェック
      if (!isLoggedIn) {
        alert('ログインが必要です');
        setPreviousPage('add-pin');
        setCurrentPage('login');
        return;
      }

      // バリデーション
      if (!pinForm.name || !pinForm.shop_type || !pinForm.latitude || !pinForm.longitude) {
        alert('必須項目（店舗名、店舗タイプ、緯度、経度）を入力してください');
        return;
      }

      try {
        // 写真URLを結合（空でないもののみ、最大3つ）
        const photoUrls = pinForm.photo_urls.filter(url => url.trim()).slice(0, 3);
        const photoUrl = photoUrls.join(',');

        // キーワードを結合（空でないもののみ、最大4つ）
        const keywords = pinForm.keywords.filter(kw => kw.trim()).slice(0, 4);

        // 送信ユーザーIDを取得（URLを送信したユーザー、なければ現在のユーザー）
        const submittedByUserId = sessionStorage.getItem('submittedByUserId') || (currentUser ? currentUser.id : null);

        // データを送信
        const res = await fetch('/shop/add_shop_json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: pinForm.name,
            shop_type: pinForm.shop_type,
            city_id: pinForm.city_id || 'hyderabad',  // デフォルトはhyderabad
            latitude: parseFloat(pinForm.latitude),
            longitude: parseFloat(pinForm.longitude),
            spicy_level: pinForm.spicy_level || 1,  // デフォルト1（データベース制約: 1-5）
            clean_level: pinForm.clean_level || 1,  // デフォルト1（データベース制約: 1-5）
            comfortable_level: pinForm.comfortable_level || 1,  // デフォルト1（データベース制約: 1-5）
            congestion_level: pinForm.congestion_level || 1,  // デフォルト1（データベース制約: 1-5）
            avg_rating: pinForm.avg_rating || 0,  // 平均評価（0-5の範囲、デフォルト0）
            photo_url: photoUrl,
            keywords: keywords,
            source_url: pinForm.source_url || '',
            submitted_by_user_id: submittedByUserId ? parseInt(submittedByUserId) : null,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.error || '店舗の追加に失敗しました');
        }

        // 成功メッセージ
        alert('店舗を追加しました！お気に入りにも追加されました。');

        // URLを削除（店舗追加成功後）
        if (selectedUrlId) {
          try {
            const deleteRes = await fetch('/shop/delete_url_json', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ url_id: selectedUrlId }),
            });
            if (!deleteRes.ok) {
              console.error('URL削除エラー');
            }
          } catch (err) {
            console.error('URL削除エラー:', err);
          }
        }

        // sessionStorageをクリア
        sessionStorage.removeItem('submittedByUserId');

        // フォームをリセット
        setPinForm({
          name: '',
          shop_type: '',
          city_id: '',
          latitude: '',
          longitude: '',
          spicy_level: 1,  // デフォルト1（データベース制約: 1-5）
          clean_level: 1,  // デフォルト1（データベース制約: 1-5）
          comfortable_level: 1,  // デフォルト1（データベース制約: 1-5）
          congestion_level: 1,  // デフォルト1（データベース制約: 1-5）
          avg_rating: 0,  // 平均評価（0-5の範囲、デフォルト0）
          photo_urls: ['', '', ''],
          keywords: ['', '', '', ''],
          source_url: '',
        });
        
        // URLリストに戻り、リストを再読み込み
        setSelectedUrlId(null);
        
        // URLリストを再取得（削除されたURLがリストから消える）
        try {
          const urlRes = await fetch('/shop/pending_urls_json', {
            credentials: 'include',
          });
          if (urlRes.ok) {
            const urlData = await urlRes.json();
            if (urlData.ok && urlData.urls) {
              setPendingUrls(urlData.urls);
            }
          }
        } catch (error) {
          console.error('URL一覧再取得エラー:', error);
        }
        
        // 店舗データを再取得して地図に表示
        const restaurantRes = await fetch(`${API_BASE_URL}/api/restaurants`);
        if (restaurantRes.ok) {
          const restaurantData = await restaurantRes.json();
          const toNumberOrNull = (v) => {
            if (v === null || v === undefined || v === '') return null;
            const n = Number(v);
            return Number.isFinite(n) ? n : null;
          };
          const restaurantsWithPosition = restaurantData.map(restaurant => {
            const keywords = (restaurant.keywords && Array.isArray(restaurant.keywords)) ? restaurant.keywords : [];
            const latitude = toNumberOrNull(restaurant.latitude);
            const longitude = toNumberOrNull(restaurant.longitude);
            const avgRating = toNumberOrNull(restaurant.avg_rating);
            return {
              ...restaurant,
              spicy_level: toNumberOrNull(restaurant.spicy_level),
              clean_level: toNumberOrNull(restaurant.clean_level),
              comfortable_level: toNumberOrNull(restaurant.comfortable_level),
              congestion_level: toNumberOrNull(restaurant.congestion_level),
              avg_rating: avgRating,
              latitude,
              longitude,
              position: restaurant.latitude && restaurant.longitude 
                ? { lat: latitude ?? getCityCoordinates(restaurant.city_id).lat, lng: longitude ?? getCityCoordinates(restaurant.city_id).lng }
                : getCityCoordinates(restaurant.city_id),
              keywords: keywords,
            };
          });
          setRestaurants(restaurantsWithPosition);
        }

        // キーワードリストを再取得（新しく追加されたキーワードを含む）
        const keywordRes = await fetch(`${API_BASE_URL}/api/keywords`);
        if (keywordRes.ok) {
          const keywordRows = await keywordRes.json();
          const words = (Array.isArray(keywordRows) ? keywordRows : [])
            .map((r) => r?.word)
            .filter((w) => typeof w === 'string' && w.trim())
            .map((w) => w.trim());
          setDbKeywords(words);
        }

        // お気に入りリストを更新
        if (isLoggedIn) {
          const favRes = await fetch('/auth/favorites_json', {
            credentials: 'include',
          });
          if (favRes.ok) {
            const favData = await favRes.json();
            if (favData.ok && favData.favorites) {
              const ids = new Set(favData.favorites.map((s) => s.id));
              setFavoriteShopIds(ids);
              setFavoriteShops(favData.favorites);
            }
          }
        }

      } catch (error) {
        console.error('ピン追加エラー:', error);
        alert(`エラーが発生しました: ${error.message}`);
      }
    };

    // URLリスト表示
    if (!selectedUrlId) {
      return (
        <main className="min-h-screen bg-white font-inter text-slate-900 w-full overflow-x-hidden">
          <div className="mx-auto max-w-md w-full">
            <div className="flex items-center px-6 py-4 border-b border-gray-200">
              <button onClick={() => { setSelectedUrlId(null); setCurrentPage(previousPage); }} className="p-2" aria-label="戻る">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <h1 className="flex-1 text-center text-lg font-semibold text-slate-900">ピン追加</h1>
              <div className="w-10"></div>
            </div>

            <div className="px-6 py-8 space-y-4 hide-scrollbar overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">送信されたURL一覧</h2>
              
              {isLoadingUrls ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-slate-500">読み込み中...</p>
                </div>
              ) : pendingUrls.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-slate-500">未処理のURLはありません</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingUrls.map((urlData) => (
                    <div
                      key={urlData.id}
                      onClick={() => handleSelectUrl(urlData)}
                      className="bg-violet-50 rounded-xl p-4 cursor-pointer hover:bg-violet-100 transition-colors border border-violet-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 mb-1 break-all">{urlData.url}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            {urlData.submitted_by_name && (
                              <span>送信者: {urlData.submitted_by_name}</span>
                            )}
                            <span>•</span>
                            <span>{new Date(urlData.created_at).toLocaleString('ja-JP')}</span>
                          </div>
                        </div>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500 flex-shrink-0">
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      );
    }

    // ピン追加フォーム表示
    return (
      <main className="min-h-screen bg-white font-inter text-slate-900 w-full overflow-x-hidden">
        <div className="mx-auto max-w-md w-full">
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <button onClick={handleBackToUrlList} className="p-2" aria-label="戻る">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="flex-1 text-center text-lg font-semibold text-slate-900">ピン追加</h1>
            <div className="w-10"></div>
          </div>

          <div className="px-6 py-8 space-y-6 hide-scrollbar overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
            {/* URL快速跳转 */}
            {pinForm.source_url && (
              <div className="bg-violet-50 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-slate-700">送信されたURL</p>
                <div className="flex items-center gap-2">
                  <input 
                    type="url" 
                    value={pinForm.source_url} 
                    readOnly
                    className="flex-1 px-3 py-2 rounded-lg bg-white border border-violet-200 text-sm text-slate-600"
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (pinForm.source_url) {
                        window.open(pinForm.source_url, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    className="px-4 py-2 bg-violet-500 text-white rounded-lg text-sm font-semibold hover:bg-violet-600 transition-colors"
                  >
                    開く
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">店舗名 *</label>
                <input 
                  type="text" 
                  value={pinForm.name}
                  onChange={(e) => setPinForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-violet-50 border-none focus:outline-none focus:ring-2 focus:ring-violet-300" 
                  placeholder="店舗名を入力"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">店舗タイプ *</label>
                <select 
                  value={pinForm.shop_type}
                  onChange={(e) => setPinForm(prev => ({ ...prev, shop_type: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-violet-50 border-none focus:outline-none focus:ring-2 focus:ring-violet-300"
                >
                  <option value="">選択してください</option>
                  <option value="restaurant">飲食店</option>
                  <option value="hotel">ホテル</option>
                  <option value="spot">スポット</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">緯度 (X) *</label>
                  <input 
                    type="number" 
                    step="any"
                    value={pinForm.latitude}
                    onChange={(e) => setPinForm(prev => ({ ...prev, latitude: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-violet-50 border-none focus:outline-none focus:ring-2 focus:ring-violet-300" 
                    placeholder="例: 17.385044"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">経度 (Y) *</label>
                  <input 
                    type="number" 
                    step="any"
                    value={pinForm.longitude}
                    onChange={(e) => setPinForm(prev => ({ ...prev, longitude: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-violet-50 border-none focus:outline-none focus:ring-2 focus:ring-violet-300" 
                    placeholder="例: 78.486671"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">平均評価（0-5の範囲）</label>
                <div className="flex items-center gap-3 mb-4">
                  <input 
                    type="range" 
                    min="0" 
                    max="5" 
                    step="0.1"
                    value={pinForm.avg_rating}
                    onChange={(e) => setPinForm(prev => ({ ...prev, avg_rating: parseFloat(e.target.value) }))}
                    className="flex-1 h-2 bg-violet-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-lg font-bold text-violet-600 w-12 text-center">{Number(pinForm.avg_rating).toFixed(1)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">評価レベル（1-5の範囲）</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">辛さレベル</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        step="1"
                        value={pinForm.spicy_level}
                        onChange={(e) => setPinForm(prev => ({ ...prev, spicy_level: parseInt(e.target.value) }))}
                        className="flex-1"
                      />
                      <span className="text-lg font-bold text-violet-700 w-8 text-center">{pinForm.spicy_level}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">清潔度</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        step="1"
                        value={pinForm.clean_level}
                        onChange={(e) => setPinForm(prev => ({ ...prev, clean_level: parseInt(e.target.value) }))}
                        className="flex-1"
                      />
                      <span className="text-lg font-bold text-violet-700 w-8 text-center">{pinForm.clean_level}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">快適度</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        step="1"
                        value={pinForm.comfortable_level}
                        onChange={(e) => setPinForm(prev => ({ ...prev, comfortable_level: parseInt(e.target.value) }))}
                        className="flex-1"
                      />
                      <span className="text-lg font-bold text-violet-700 w-8 text-center">{pinForm.comfortable_level}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">混雑度</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        step="1"
                        value={pinForm.congestion_level}
                        onChange={(e) => setPinForm(prev => ({ ...prev, congestion_level: parseInt(e.target.value) }))}
                        className="flex-1"
                      />
                      <span className="text-lg font-bold text-violet-600 w-8 text-center">{pinForm.congestion_level}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">写真URL（最大3枚）</label>
                {[0, 1, 2].map((idx) => (
                  <input
                    key={idx}
                    type="url"
                    value={pinForm.photo_urls[idx] || ''}
                    onChange={(e) => {
                      const newUrls = [...pinForm.photo_urls];
                      newUrls[idx] = e.target.value;
                      setPinForm(prev => ({ ...prev, photo_urls: newUrls }));
                    }}
                    className={`w-full px-4 py-3 rounded-xl bg-violet-50 border-none focus:outline-none focus:ring-2 focus:ring-violet-300 mb-2 ${idx === 0 ? '' : 'mt-2'}`}
                    placeholder={`写真URL ${idx + 1}（オプション）`}
                  />
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">キーワード（最大4つ）</label>
                {[0, 1, 2, 3].map((idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={pinForm.keywords[idx] || ''}
                    onChange={(e) => {
                      const newKeywords = [...pinForm.keywords];
                      newKeywords[idx] = e.target.value;
                      setPinForm(prev => ({ ...prev, keywords: newKeywords }));
                    }}
                    className={`w-full px-4 py-3 rounded-xl bg-violet-50 border-none focus:outline-none focus:ring-2 focus:ring-violet-300 mb-2 ${idx === 0 ? '' : 'mt-2'}`}
                    placeholder={`キーワード ${idx + 1}（オプション）`}
                  />
                ))}
              </div>
            </div>

            <button 
              className="w-full bg-violet-500 text-white font-semibold py-3 rounded-full shadow-lg hover:bg-violet-600 transition-colors"
              onClick={handleSubmitPin}
            >
              ピンを追加
            </button>
          </div>
        </div>
      </main>
    );
  }

  // マップページ（検索結果オーバーレイもここで表示）
  if (currentPage === 'map' || currentPage === 'detail') {
    return (
      <main className="min-h-screen bg-white font-inter text-slate-900 w-full overflow-x-hidden">
        <div className="mx-auto max-w-md min-h-screen flex flex-col relative w-full">
          {!isDetailOpen && !isSearchOpen && (
            <div className="absolute top-32 inset-x-0 flex justify-center px-6 z-20">
            <div onClick={() => setIsFilterOpen(true)} className="flex w-full max-w-[280px] items-center gap-3 rounded-full bg-white px-5 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.15)] cursor-pointer">
              <input type="text" placeholder="エリア・スポットを検索" className="flex-1 border-none bg-transparent text-sm text-slate-500 placeholder:text-slate-400 focus:outline-none pointer-events-none" readOnly />
              <img src={searchIcon} alt="Search" className="h-5 w-5 opacity-60" />
            </div>
            </div>
          )}

          {!isDetailOpen && !isSearchOpen && (
            <>
              {isLoggedIn && currentUser ? (
                <button 
                  onClick={() => setIsMenuOpen(true)} 
                  className="absolute top-8 left-6 z-20 rounded-md bg-white/90 px-5 py-1 text-sm font-semibold text-violet-500 shadow-lg shadow-violet-500/30"
                >
                  {currentUser.name || currentUser.email}
                </button>
              ) : (
                <button 
                  onClick={() => { setPreviousPage('map'); setCurrentPage('login'); }} 
                  className="absolute top-8 left-6 z-20 rounded-md bg-white/90 px-5 py-1 text-sm font-semibold text-violet-500 shadow-lg shadow-violet-500/30"
                >
                  ログイン
                </button>
              )}
            </>
          )}

          {!isDetailOpen && !isSearchOpen && (
            <button onClick={() => setIsMenuOpen(true)} className="absolute top-8 right-6 z-20 rounded-md bg-violet-500 p-4 text-white shadow-lg hover:bg-violet-600 transition-colors" aria-label="メニュー">
            <div className="space-y-1.5">
              <span className="block h-[2.5px] w-4 rounded-full bg-white" />
              <span className="block h-[2.5px] w-6 rounded-full bg-white" />
              <span className="block h-[2.5px] w-4 rounded-full bg-white" />
            </div>
            </button>
          )}

          <div className="absolute inset-0" style={{ zIndex: 1 }}>
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={mapLocation}
                zoom={12}
                onLoad={(map) => {
                  mapRef.current = map;
                }}
                onUnmount={() => {
                  mapRef.current = null;
                }}
                options={{
                  disableDefaultUI: true,
                  zoomControl: false,
                  mapTypeControl: false,
                  scaleControl: false,
                  streetViewControl: false,
                  rotateControl: false,
                  fullscreenControl: false,
                  clickableIcons: false,
                  gestureHandling: 'greedy',
                  styles: [
                    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
                    { featureType: "poi.business", stylers: [{ visibility: "off" }] },
                    { featureType: "poi.park", elementType: "labels.text", stylers: [{ visibility: "off" }] },
                    { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] }
                  ],
                }}
              >
                {(() => {
                  // マップ表示：フィルタ条件で絞り込み
                  const filtered = restaurants.filter((restaurant) => {
                    if (selectedCity && restaurant.city_id !== selectedCity.id) {
                      return false;
                    }
                    if (Array.isArray(selectedTypes) && selectedTypes.length > 0 && !selectedTypes.includes(restaurant.shop_type)) {
                      return false;
                    }
                    const spicy = restaurant.spicy_level ?? 0;
                    const clean = restaurant.clean_level ?? 0;
                    const comfort = restaurant.comfortable_level ?? 0;
                    const crowd = restaurant.congestion_level ?? 0;

                    if ((filters.spiciness || 0) > 0 && spicy < filters.spiciness) return false;
                    if ((filters.cleanliness || 0) > 0 && clean < filters.cleanliness) return false;
                    if ((filters.comfort || 0) > 0 && comfort < filters.comfort) return false;
                    // 混雑度：数値が小さいほど空いている想定なので、上限でフィルタ
                    if ((filters.crowd || 0) > 0 && crowd > filters.crowd) return false;
                    return true;
                  });
                  return filtered;
                })()
                  .map((restaurant) => {
                  const createCustomIcon = () => {
                    if (typeof window !== 'undefined' && window.google && window.google.maps) {
                      const rating = restaurant.avg_rating?.toFixed(1) || '0.0';
                      // shop_type に応じて色を変える
                      let fillColor = '#7c3aed'; // デフォルト（飲食店）
                      
                      if (restaurant.shop_type === 'hotel') {
                        fillColor = '#059669'; // 绿色（酒店）
                      } else if (restaurant.shop_type === 'spot') {
                        fillColor = '#dc2626'; // 红色（景点）
                      } else {
                        fillColor = '#7c3aed'; // 紫色（餐厅）
                      }

                      // SVG ピン（評価と種別色）
                      const svgIcon = `
                        <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 0C8.954 0 0 8.954 0 20c0 15 20 30 20 30s20-15 20-30C40 8.954 31.046 0 20 0z" fill="${fillColor}"/>
                          <circle cx="20" cy="20" r="8" fill="white"/>
                          <text x="20" y="25" font-family="Arial, sans-serif" font-size="11" fill="${fillColor}" text-anchor="middle" font-weight="bold">${rating}</text>
                        </svg>
                      `;
                      return {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgIcon),
                        scaledSize: new window.google.maps.Size(40, 50),
                        anchor: new window.google.maps.Point(20, 50),
                      };
                    }
                    return undefined;
                  };

                  return (
                    <Marker
                      key={restaurant.id}
                      position={restaurant.position}
                      title={`${restaurant.name} - 评分: ${restaurant.avg_rating}`}
                      icon={createCustomIcon()}
                      onClick={() => setSelectedRestaurant(restaurant)}
                    />
                  );
                })}
              </GoogleMap>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-500">地図を読み込み中...</p>
              </div>
            )}
          </div>

          {!isDetailOpen && !isSearchOpen && (
            <>
              <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onNavigate={handleMenuNavigate} isLoggedIn={isLoggedIn} onLogout={handleLogout} isAdmin={isAdmin} />
          <FilterPanel
            isOpen={isFilterOpen}
            onClose={handleCloseFilter}
            filters={filters}
            onFilterChange={handleFilterChange}
            selectedCity={selectedCity}
            onCitySelect={handleCitySelect}
            isCitySelectOpen={isCitySelectOpen}
            setIsCitySelectOpen={setIsCitySelectOpen}
            selectedTypes={selectedTypes}
            setSelectedTypes={setSelectedTypes}
            keyword={keyword}
            setKeyword={setKeyword}
            availableKeywords={keywordOptions}
            selectedKeywords={selectedKeywords}
            setSelectedKeywords={setSelectedKeywords}
            onSearch={searchShops}
          />
            </>
          )}
          
          {/* 餐厅详情卡片 */}
          {!isDetailOpen && !isSearchOpen && selectedRestaurant && (
            <div
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out max-w-md mx-auto max-h-[70vh] overflow-y-auto hide-scrollbar"
            >
              {/* 关闭按钮 */}
              <button 
                onClick={() => setSelectedRestaurant(null)}
                className="absolute top-4 right-4 z-10 bg-black/60 rounded-full p-2 text-white hover:bg-black/80 transition-colors"
                aria-label="閉じる"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>

              {/* 餐厅图片 - 来自数据库的 photo_url */}
              <div className="relative h-48 w-full overflow-hidden rounded-t-3xl bg-gradient-to-br from-violet-100 to-purple-200">
                {selectedRestaurantPhotoUrls.length > 0 && (
                  <>
                    <div
                      ref={photoCarouselRef}
                      className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar cursor-grab active:cursor-grabbing select-none"
                      style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}
                      onScroll={(e) => {
                        const el = e.currentTarget;
                        if (!el.clientWidth) return;
                        const idx = Math.round(el.scrollLeft / el.clientWidth);
                        if (idx !== activePhotoIndex) setActivePhotoIndex(idx);
                      }}
                      onPointerDown={onCarouselPointerDown}
                      onPointerMove={onCarouselPointerMove}
                      onPointerUp={onCarouselPointerUpOrCancel}
                      onPointerCancel={onCarouselPointerUpOrCancel}
                    >
                      {selectedRestaurantPhotoUrls.map((url, idx) => (
                        <div key={`${url}-${idx}`} className="w-full h-full flex-shrink-0 snap-center">
                          <img
                            src={url}
                            alt={`${selectedRestaurant.name} ${idx + 1}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            draggable={false}
                            onDragStart={(ev) => ev.preventDefault()}
                          />
                        </div>
                      ))}
                    </div>

                    {/* 左右ボタンは表示しない（ドラッグ/スワイプで切替） */}
                  </>
                )}
                {/* 占位符 - 当没有图片或图片加载失败时显示 */}
                <div className={`absolute inset-0 flex items-center justify-center ${selectedRestaurantPhotoUrls.length > 0 ? 'hidden' : 'flex'}`}>
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto text-violet-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-violet-600 text-sm font-medium">{selectedRestaurant.name}</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-white text-xl font-bold">{selectedRestaurant.name}</h3>
                    <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <span className="text-white text-sm font-semibold">{selectedRestaurant.avg_rating?.toFixed(1) || '0.0'}</span>
                    </div>
                    {/* 店铺类型 - 来自数据库的 shop_type */}
                    {selectedRestaurant.shop_type && (
                      <span className="bg-violet-500/80 text-white text-xs px-2 py-1 rounded-full">
                        {selectedRestaurant.shop_type === 'restaurant' ? '飲食店' : 
                         selectedRestaurant.shop_type === 'hotel' ? 'ホテル' : 
                         selectedRestaurant.shop_type === 'spot' ? 'スポット' : selectedRestaurant.shop_type}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 轮播指示点（多图时显示） */}
              {selectedRestaurantPhotoUrls.length > 1 && (
                <div className="flex justify-center gap-1.5 py-5">
                  {selectedRestaurantPhotoUrls.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      aria-label={`写真 ${idx + 1}`}
                      onClick={() => scrollToPhotoIndex(idx)}
                      className={`h-1.5 w-1.5 rounded-full transition-colors ${idx === activePhotoIndex ? 'bg-violet-500' : 'bg-gray-300'}`}
                    />
                  ))}
                </div>
              )}

              <div className="px-6 pb-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: '辛さレベル', value: selectedRestaurant.spicy_level, icon: spiceIconDetail, alt: 'spicy' },
                    { label: '清潔度', value: selectedRestaurant.clean_level, icon: cleanlinessIconDetail, alt: 'cleanliness' },
                    { label: '快適度', value: selectedRestaurant.comfortable_level, icon: comfortIconDetail, alt: 'comfort' },
                    { label: '混雑度', value: selectedRestaurant.congestion_level, icon: crowdIconDetail, alt: 'crowd' },
                  ].map(({ label, value, icon, alt }) => (
                    <div key={label} className="flex flex-col gap-1.5">
                      <span className="text-xs text-gray-600 font-medium">{label}</span>
                      <div className="flex gap-0.5 items-center">
                        {[1, 2, 3, 4, 5].map((level) => {
                          const isActive = level <= (value || 0);
                          return (
                            <img
                              key={level}
                              src={icon}
                              alt={alt}
                              className={`w-4 h-4 object-contain ${isActive ? 'opacity-100' : 'opacity-30'}`}
                            />
                          );
                        })}
                        <span className="ml-1.5 text-xs font-bold text-gray-700">{value || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 关键词标签 */}
              {(selectedRestaurant.keywords && Array.isArray(selectedRestaurant.keywords) && selectedRestaurant.keywords.length > 0) && (
                <div className="px-6 pb-4">
                  <p className="text-sm text-gray-600 mb-2 font-medium">キーワード</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRestaurant.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200 hover:bg-violet-200 transition-colors"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="px-6 pb-6 flex gap-3">
                <button 
                  onClick={() => toggleFavorite(selectedRestaurant.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-medium transition-colors ${
                    favoriteShopIds.has(selectedRestaurant.id)
                      ? 'bg-violet-500 text-white hover:bg-violet-600'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill={favoriteShopIds.has(selectedRestaurant.id) ? 'currentColor' : 'none'} 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <span>{favoriteShopIds.has(selectedRestaurant.id) ? 'お気に入り済み' : '気になる'}</span>
                </button>
                <button 
                  onClick={openDetailPage}
                  className="flex-1 flex items-center justify-center gap-2 bg-violet-500 text-white py-3 rounded-full font-medium hover:bg-violet-600 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  <span>独特口コミ書く</span>
                </button>
              </div>
            </div>
          )}

          {/* 検索結果画面（筛选菜单按下检索后显示） */}
          {isSearchOpen && (
            <div className="fixed inset-x-0 top-8 bottom-6 z-40 pointer-events-none w-full overflow-x-hidden">
              <div className="mx-auto max-w-md h-full px-6 pointer-events-auto w-full">
                <div className="h-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                  <div className="px-4 pt-4 pb-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">検索結果</p>
                      <p className="text-xs text-slate-500">{isSearching ? '検索中…' : `${shops.length} 件`}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchError(null);
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-full p-2 transition-colors"
                      aria-label="閉じる"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* 並び替えボタン */}
                  <div className="px-4 py-3 flex gap-2">
                    {[
                      { by: 'spicy', label: '辛さ' },
                      { by: 'clean', label: '清潔度' },
                      { by: 'comfort', label: '快適度' },
                      { by: 'crowd', label: '混雑度' },
                    ].map((s) => {
                      const active = searchSort.by === s.by;
                      const arrow = active ? (searchSort.dir === 'asc' ? '▲' : '▼') : '▼';
                      return (
                        <button
                          key={s.by}
                          type="button"
                          onClick={() => handleSearchSortClick(s.by)}
                          className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold border transition-colors ${
                            active ? 'bg-violet-500 text-white border-violet-500' : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {s.label} {arrow}
                        </button>
                      );
                    })}
                  </div>

                  {searchError && (
                    <div className="px-4 pb-2 text-xs text-red-600">{searchError}</div>
                  )}

                  <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-4 space-y-4">
                    {shops.map((shop) => {
                      const photos = parsePhotoUrls(shop.photo_url).slice(0, 3);
                      return (
                        <button
                          key={shop.id}
                          type="button"
                          onClick={() => {
                            setSelectedRestaurant(shop);
                            focusShopOnMap(shop);
                            setIsSearchOpen(false);
                            // 下部の詳細カードのみ表示（90vh の詳細ドロワーは開かない）
                            setCurrentPage('map');
                          }}
                          className="w-full text-left bg-white rounded-2xl shadow-[0_10px_25px_rgba(15,23,42,0.12)] border border-gray-100 overflow-hidden"
                        >
                          <div className="p-4 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-base font-bold text-slate-900 truncate">{shop.name}</p>
                                <div className="flex items-center gap-1">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                  <span className="text-sm font-semibold text-slate-700">{Number(shop.avg_rating || 0).toFixed(1)}</span>
                                </div>
                              </div>
                              {Array.isArray(shop.keywords) && shop.keywords.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500">
                                  {shop.keywords.slice(0, 4).map((k) => (
                                    <span key={k}>{k}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              aria-label="お気に入り"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFavorite(shop.id);
                              }}
                              className={`shrink-0 rounded-full p-2 transition-colors ${
                                favoriteShopIds.has(shop.id)
                                  ? 'text-violet-500 bg-violet-50'
                                  : 'text-slate-300 hover:text-violet-500 hover:bg-violet-50'
                              }`}
                            >
                              <svg 
                                width="18" 
                                height="18" 
                                viewBox="0 0 24 24" 
                                fill={favoriteShopIds.has(shop.id) ? 'currentColor' : 'none'} 
                                stroke="currentColor" 
                                strokeWidth="2.2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              >
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                              </svg>
                            </button>
                          </div>

                          <div className="px-4 pb-3">
                            <div className="grid grid-cols-3 gap-2">
                              {photos.length > 0 ? (
                                photos.map((u, idx) => (
                                  <div key={`${u}-${idx}`} className="h-20 rounded-xl overflow-hidden bg-gray-100">
                                    <img src={u} alt={`${shop.name}-${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-3 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-slate-400">
                                  no photo
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="px-4 pb-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900">辛さレベル</span>
                                <span className="text-sm font-bold text-slate-900">{shop.spicy_level || 0}</span>
                              </div>
                              <div className="flex gap-1 w-[116px] justify-end">
                                {[1, 2, 3, 4, 5].map((lv) => (
                                  <img key={lv} src={spiceIconDetail} alt="spicy" className={`w-5 h-5 ${lv <= (shop.spicy_level || 0) ? 'opacity-100' : 'opacity-25'}`} />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900">清潔度</span>
                                <span className="text-sm font-bold text-slate-900">{shop.clean_level || 0}</span>
                              </div>
                              <div className="flex gap-1 w-[116px] justify-end">
                                {[1, 2, 3, 4, 5].map((lv) => (
                                  <img key={lv} src={cleanlinessIconDetail} alt="clean" className={`w-5 h-5 ${lv <= (shop.clean_level || 0) ? 'opacity-100' : 'opacity-25'}`} />
                                ))}
                              </div>
                            </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900">快適度</span>
                              <span className="text-sm font-bold text-slate-900">{shop.comfortable_level || 0}</span>
                            </div>
                            <div className="flex gap-1 w-[116px] justify-end">
                              {[1, 2, 3, 4, 5].map((lv) => (
                                <img key={lv} src={comfortIconDetail} alt="comfort" className={`w-5 h-5 ${lv <= (shop.comfortable_level || 0) ? 'opacity-100' : 'opacity-25'}`} />
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900">混雑度</span>
                              <span className="text-sm font-bold text-slate-900">{shop.congestion_level || 0}</span>
                            </div>
                            <div className="flex gap-1 w-[116px] justify-end">
                              {[1, 2, 3, 4, 5].map((lv) => (
                                <img key={lv} src={crowdIconDetail} alt="crowd" className={`w-5 h-5 object-contain ${lv <= (shop.congestion_level || 0) ? 'opacity-100' : 'opacity-25'}`} />
                              ))}
                            </div>
                          </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 詳細オーバーレイ（背景は地図のまま） */}
          {isDetailOpen && selectedRestaurant && (
            <div className="fixed inset-0 z-50 pointer-events-none w-full overflow-x-hidden">
              <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-md max-h-[90vh] bg-white rounded-t-3xl shadow-2xl overflow-y-auto hide-scrollbar pointer-events-auto" style={{ maxHeight: '90dvh' }}>
                {/* 固定位置的关闭按钮 - 始终在详情页右上方 */}
                <button
                  onClick={closeDetailPage}
                  className="absolute top-4 right-4 z-[60] bg-black/60 rounded-full p-2 text-white hover:bg-black/80 transition-colors pointer-events-auto"
                  aria-label="閉じる"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
                {/* 画像 */}
                <div className="relative h-56 w-full overflow-hidden rounded-t-3xl bg-gradient-to-br from-violet-100 to-purple-200">

                  {selectedRestaurantPhotoUrls.length > 0 && (
                    <div
                      ref={photoCarouselRef}
                      className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar cursor-grab active:cursor-grabbing select-none"
                      style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}
                      onScroll={(e) => {
                        const el = e.currentTarget;
                        if (!el.clientWidth) return;
                        const idx = Math.round(el.scrollLeft / el.clientWidth);
                        if (idx !== activePhotoIndex) setActivePhotoIndex(idx);
                      }}
                      onPointerDown={onCarouselPointerDown}
                      onPointerMove={onCarouselPointerMove}
                      onPointerUp={onCarouselPointerUpOrCancel}
                      onPointerCancel={onCarouselPointerUpOrCancel}
                    >
                      {selectedRestaurantPhotoUrls.map((url, idx) => (
                        <div key={`${url}-${idx}`} className="w-full h-full flex-shrink-0 snap-center">
                          <img
                            src={url}
                            alt={`${selectedRestaurant.name} ${idx + 1}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            draggable={false}
                            onDragStart={(ev) => ev.preventDefault()}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedRestaurantPhotoUrls.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-16 h-16 mx-auto text-violet-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-violet-600 text-sm font-medium">{selectedRestaurant.name}</p>
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-5 right-5 z-10 pointer-events-none">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white text-2xl font-extrabold">{selectedRestaurant.name}</h3>
                      <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span className="text-white text-sm font-semibold">{selectedRestaurant.avg_rating?.toFixed?.(1) ?? '0.0'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 指示点 */}
                {selectedRestaurantPhotoUrls.length > 1 && (
                  <div className="flex justify-center gap-2 pt-5 pb-8">
                    {selectedRestaurantPhotoUrls.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        aria-label={`写真 ${idx + 1}`}
                        onClick={() => scrollToPhotoIndex(idx)}
                        className={`h-2 w-2 rounded-full transition-colors ${idx === activePhotoIndex ? 'bg-violet-500' : 'bg-gray-300'}`}
                      />
                    ))}
                  </div>
                )}

                {/* 评论按钮とお気に入りボタン */}
                <div className={`px-6 ${selectedRestaurantPhotoUrls.length > 1 ? '' : 'mt-8'} space-y-3`}>
                  <button
                    onClick={() => setIsWriteReviewOpen(true)}
                    className="w-full bg-violet-500 text-white font-semibold py-3 rounded-full shadow-lg hover:bg-violet-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
                      <path d="M4 20h16" />
                    </svg>
                    独特口コミ書く
                  </button>
                  <button
                    onClick={() => toggleFavorite(selectedRestaurant.id)}
                    className={`w-full py-3 rounded-full font-semibold transition-colors flex items-center justify-center gap-2 ${
                      favoriteShopIds.has(selectedRestaurant.id)
                        ? 'bg-violet-100 text-violet-600 hover:bg-violet-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <svg 
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill={favoriteShopIds.has(selectedRestaurant.id) ? 'currentColor' : 'none'} 
                      stroke="currentColor" 
                      strokeWidth="2.2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    {favoriteShopIds.has(selectedRestaurant.id) ? 'お気に入り済み' : 'お気に入りに追加'}
                  </button>
                </div>

                {/* 关键词 */}
                {(selectedRestaurant.keywords && Array.isArray(selectedRestaurant.keywords) && selectedRestaurant.keywords.length > 0) && (
                  <div className="px-6 pt-6">
                    <div className="flex flex-wrap gap-2">
                      {selectedRestaurant.keywords.map((kw, idx) => (
                        <span key={`${kw}-${idx}`} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 等级 */}
                <div className="px-6 pt-6">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: '辛さレベル', value: selectedRestaurant.spicy_level, icon: spiceIconDetail, alt: 'spicy' },
                      { label: '清潔度', value: selectedRestaurant.clean_level, icon: cleanlinessIconDetail, alt: 'cleanliness' },
                      { label: '快適度', value: selectedRestaurant.comfortable_level, icon: comfortIconDetail, alt: 'comfort' },
                      { label: '混雑度', value: selectedRestaurant.congestion_level, icon: crowdIconDetail, alt: 'crowd' },
                    ].map(({ label, value, icon, alt }) => (
                      <div key={label} className="flex flex-col gap-1.5">
                        <span className="text-xs text-gray-600 font-medium">{label}</span>
                        <div className="flex gap-0.5 items-center">
                          {[1, 2, 3, 4, 5].map((level) => {
                            const isActive = level <= (value || 0);
                            return (
                              <img
                                key={level}
                                src={icon}
                                alt={alt}
                                className={`w-4 h-4 object-contain ${isActive ? 'opacity-100' : 'opacity-30'}`}
                              />
                            );
                          })}
                          <span className="ml-1.5 text-xs font-bold text-gray-700">{value || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 用户评论 */}
                <div className="px-6 pt-8 pb-32">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">口コミ</h4>
                    <span className="text-xs text-slate-500">{currentReviews.length} 件</span>
                  </div>

                  {currentReviews.length === 0 ? (
                    <div className="mt-4 text-sm text-slate-500">まだ口コミがありません。最初の口コミを書いてみましょう。</div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {currentReviews.map((r) => (
                        <div key={r.id} className="border border-gray-200 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold">
                              {(r.name || 'G')[0]}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                                <p className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                              </div>
                              <p className="mt-2 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{r.text}</p>

                              {r.ratings && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <span className="text-[11px] px-2 py-1 rounded-md bg-red-50 text-red-600 border border-red-100">辛さ {r.ratings.spicy}</span>
                                  <span className="text-[11px] px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100">清潔度 {r.ratings.clean}</span>
                                  <span className="text-[11px] px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-100">快適度 {r.ratings.comfort}</span>
                                  <span className="text-[11px] px-2 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-100">混雑度 {r.ratings.crowd}</span>
                                  {r.avg_rating !== null && r.avg_rating !== undefined && (
                                    <span className="text-[11px] px-2 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-100">総合評価 {r.avg_rating}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Write review modal */}
                {isWriteReviewOpen && (
                  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6" onClick={() => setIsWriteReviewOpen(false)}>
                    <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                      <div className="bg-violet-500 p-5 relative">
                        <button
                          onClick={() => setIsWriteReviewOpen(false)}
                          className="absolute top-3 right-3 text-white/90 hover:text-white bg-white/15 hover:bg-white/25 rounded-full p-2 transition-colors"
                          aria-label="閉じる"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>

                        <p className="text-white text-sm font-semibold leading-snug">
                          あなたの口コミが他のお客様の参考になります、<br />
                          お気に入りポイントを一言でも教えてください！
                        </p>

                        <div className="mt-4 bg-white rounded-xl p-3">
                          <textarea
                            value={reviewForm.text}
                            onChange={(e) => setReviewForm((p) => ({ ...p, text: e.target.value }))}
                            className="w-full min-h-[140px] bg-white border-none focus:outline-none resize-none text-slate-800 text-sm"
                            placeholder="ここに口コミを書く..."
                          />
                        </div>

                        <div className="mt-4 grid grid-cols-4 gap-2">
                          {[
                            { key: 'spicy', label: '辛さ' },
                            { key: 'clean', label: '清潔度' },
                            { key: 'comfort', label: '快適度' },
                            { key: 'crowd', label: '混雑度' },
                          ].map(({ key, label }) => (
                            <div key={key} className="relative w-full">
                              <select
                                value={reviewForm[key]}
                                onChange={(e) => setReviewForm((p) => ({ ...p, [key]: e.target.value }))}
                                className="w-full appearance-none bg-white/95 text-violet-700 text-[11px] font-semibold px-1.5 py-2 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60 text-center [text-align-last:center]"
                              >
                                <option value="">{label}▼</option>
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <option key={n} value={n}>
                                    {label} {n}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3">
                          <div className="relative w-full">
                            <select
                              value={reviewForm.avg_rating}
                              onChange={(e) => setReviewForm((p) => ({ ...p, avg_rating: e.target.value }))}
                              className="w-full appearance-none bg-white/95 text-violet-700 text-[11px] font-semibold px-1.5 py-2 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60 text-center [text-align-last:center]"
                            >
                              <option value="">総合評価▼</option>
                              {[0, 1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>
                                  総合評価 {n}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="mt-5 flex justify-center">
                          <button
                            onClick={submitReview}
                            className="bg-white text-violet-600 font-extrabold px-8 py-3 rounded-full shadow-lg hover:bg-white/95 transition-colors flex items-center gap-2"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                            シェアする
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isDetailOpen && (
            <>
              <button onClick={() => setIsUrlSubmitOpen(true)} className="absolute bottom-40 right-6 z-20 bg-violet-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-violet-600 transition-colors" aria-label="スポット追加">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </button>

              {isUrlSubmitOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6" onClick={() => setIsUrlSubmitOpen(false)}>
                  <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                    <a href={`https://www.tripadvisor.com/Search?q=${getCurrentCity()}`} target="_blank" rel="noopener noreferrer" className="bg-violet-500 px-6 py-4 flex items-center justify-between hover:bg-violet-600 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <img src={tripadvisorIcon} alt="TripAdvisor" className="w-8 h-8 object-contain" />
                        <h3 className="text-white font-bold text-lg">TripAdvisor site</h3>
                      </div>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsUrlSubmitOpen(false); }} className="text-white hover:bg-white/20 rounded-full p-1 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M4 4L16 16M16 4L4 16" />
                        </svg>
                      </button>
                    </a>
                    <div className="p-6 space-y-6">
                      <p className="text-sm text-slate-700 leading-relaxed">気になるレストラン・ホテル・スポットを見つけてワクワクする詳細ページのURLを管理者さんにポイっと送ってくださいね!</p>
                      <input type="url" value={restaurantUrl} onChange={(e) => setRestaurantUrl(e.target.value)} placeholder="https://..." className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-violet-500 focus:outline-none transition-colors" />
                      <button 
                        onClick={async () => { 
                          if (!restaurantUrl || !restaurantUrl.trim()) {
                            alert('URLを入力してください');
                            return;
                          }
                          
                          try {
                            // URLを送信
                            const res = await fetch('/shop/submit_url_json', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ url: restaurantUrl }),
                            });
                            
                            const data = await res.json();
                            if (res.ok && data.ok) {
                              alert('URL送信完了！管理者に送信されました。');
                              setRestaurantUrl('');
                              setIsUrlSubmitOpen(false);
                            } else {
                              alert('URL送信に失敗しました。もう一度お試しください。');
                            }
                          } catch (error) {
                            console.error('URL送信エラー:', error);
                            alert('URL送信に失敗しました。もう一度お試しください。');
                          }
                        }} 
                        className="w-full bg-violet-500 text-white font-semibold py-3 rounded-full shadow-lg hover:bg-violet-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                        </svg>
                        URL送る
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    );
  }

  // ホームページ
  return (
    <main className="min-h-screen bg-white font-inter text-slate-900">
      <div className="mx-auto max-w-md relative">
        <header className="relative h-40 shrink-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImg})` }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-transparent" />
          <div className="relative flex items-start justify-between px-6 pt-8">
            {isLoggedIn && currentUser ? (
              <button 
                onClick={() => setIsMenuOpen(true)} 
                className="rounded-md bg-white/90 px-5 py-1 text-sm font-semibold text-violet-500 shadow-lg shadow-violet-500/30"
              >
                {currentUser.name || currentUser.email}
              </button>
            ) : (
              <button 
                onClick={() => { setPreviousPage('home'); setCurrentPage('login'); }} 
                className="rounded-md bg-white/90 px-5 py-1 text-sm font-semibold text-violet-500 shadow-lg shadow-violet-500/30"
              >
                ログイン
              </button>
            )}
            <button onClick={() => setIsMenuOpen(true)} className="rounded-md bg-violet-500 p-4 text-white shadow-lg hover:bg-violet-600 transition-colors" aria-label="メニュー">
              <div className="space-y-1.5">
                <span className="block h-[2.5px] w-4 rounded-full bg-white" />
                <span className="block h-[2.5px] w-6 rounded-full bg-white" />
                <span className="block h-[2.5px] w-4 rounded-full bg-white" />
              </div>
            </button>
          </div>
          <div className="absolute inset-x-0 bottom-[-14px] flex justify-center px-6">
            <div onClick={() => setIsFilterOpen(true)} className="flex w-full max-w-[280px] items-center gap-3 rounded-full bg-white px-5 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.15)] cursor-pointer">
              <input type="text" placeholder="エリア・スポットを検索" className="flex-1 border-none bg-transparent text-sm text-slate-500 placeholder:text-slate-400 focus:outline-none pointer-events-none" readOnly />
              <img src={searchIcon} alt="Search" className="h-5 w-5 opacity-60" />
            </div>
          </div>
        </header>

        <div className="space-y-4 bg-white px-8 pb-10 pt-12">
          <div className="space-y-3">
            <div 
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => { 
                      setMapLocation({ lat: position.coords.latitude, lng: position.coords.longitude }); 
                      setCurrentPage('map'); 
                    },
                    () => { 
                      setMapLocation(cityLocations.hyderabad); 
                      setCurrentPage('map'); 
                    }
                  );
                } else {
                  setMapLocation(cityLocations.hyderabad);
                  setCurrentPage('map');
                }
              }} 
              className="h-40 rounded-xl bg-cover bg-center shadow-[0_18px_35px_rgba(15,23,42,0.15)] cursor-pointer hover:shadow-[0_20px_40px_rgba(15,23,42,0.2)] transition-shadow" 
              style={{ backgroundImage: `url(${hyderabadImg})` }}
            >
              <div className="flex h-full items-center justify-center rounded-3xl bg-black/35">
                <p className="text-lg font-semibold text-white tracking-widest">現在地周辺</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {cityCards.map((city) => (
              <article key={city.id} onClick={() => { setMapLocation(cityLocations[city.id] || cityLocations.hyderabad); setCurrentPage('map'); }} className="h-28 rounded-2xl bg-cover bg-center shadow-[0_12px_28px_rgba(15,23,42,0.12)] cursor-pointer hover:shadow-[0_14px_32px_rgba(15,23,42,0.16)] transition-shadow" style={{ backgroundImage: `url(${city.image})` }}>
                <div className="flex h-full items-end rounded-2xl bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-sm font-semibold text-white">{city.title}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="space-y-10">
            {lockedSections.map((section) => (
              <div key={section.id} className="space-y-3">
                <p className="text-sm font-medium text-slate-700">{section.title}</p>
                {!isLoggedIn && (
                  <button 
                    onClick={() => {
                      setPreviousPage('home');
                      setCurrentPage('login');
                    }}
                    className="flex w-[60%] mx-auto items-center justify-center gap-2 rounded-full bg-violet-400 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(124,58,237,0.4)]"
                  >
                    <img src={lockIcon} alt="Lock" className="h-4 w-4" />
                    <span className="font-medium">アカウント登録で表示</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onNavigate={handleMenuNavigate} isLoggedIn={isLoggedIn} onLogout={handleLogout} isAdmin={isAdmin} />
        <FilterPanel
          isOpen={isFilterOpen}
          onClose={handleCloseFilter}
          filters={filters}
          onFilterChange={handleFilterChange}
          selectedCity={selectedCity}
          onCitySelect={handleCitySelect}
          isCitySelectOpen={isCitySelectOpen}
          setIsCitySelectOpen={setIsCitySelectOpen}
          selectedTypes={selectedTypes}
          setSelectedTypes={setSelectedTypes}
          keyword={keyword}
          setKeyword={setKeyword}
          availableKeywords={keywordOptions}
          selectedKeywords={selectedKeywords}
          setSelectedKeywords={setSelectedKeywords}
          onSearch={searchShops}
        />
      </div>

      {/* 検索結果オーバーレイ（ホーム背景のまま表示） */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <div className="absolute inset-x-0 top-8 bottom-6 mx-auto max-w-md px-6 pointer-events-auto">
            <div className="h-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
              <div className="px-4 pt-4 pb-3 border-b border-gray-200 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">検索結果</p>
                  <p className="text-xs text-slate-500">{isSearching ? '検索中…' : `${shops.length} 件`}</p>
                </div>
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchError(null);
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-full p-2 transition-colors"
                  aria-label="閉じる"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-4 py-3 flex gap-2">
                {[
                  { by: 'spicy', label: '辛さ' },
                  { by: 'clean', label: '清潔度' },
                  { by: 'comfort', label: '快適度' },
                  { by: 'crowd', label: '混雑度' },
                ].map((s) => {
                  const active = searchSort.by === s.by;
                  const arrow = active ? (searchSort.dir === 'asc' ? '▲' : '▼') : '▼';
                  return (
                    <button
                      key={s.by}
                      type="button"
                      onClick={() => handleSearchSortClick(s.by)}
                      className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold border transition-colors ${
                        active ? 'bg-violet-500 text-white border-violet-500' : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {s.label} {arrow}
                    </button>
                  );
                })}
              </div>

              {searchError && <div className="px-4 pb-2 text-xs text-red-600">{searchError}</div>}

              <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-4 space-y-4">
                {shops.map((shop) => {
                  const photos = parsePhotoUrls(shop.photo_url).slice(0, 3);
                  return (
                    <button
                      key={shop.id}
                      type="button"
                      onClick={() => {
                        setSelectedRestaurant(shop);
                        focusShopOnMap(shop);
                        setIsSearchOpen(false);
                        // 下部の詳細カードのみ表示（90vh の詳細ドロワーは開かない）
                        setCurrentPage('map');
                      }}
                      className="w-full text-left bg-white rounded-2xl shadow-[0_10px_25px_rgba(15,23,42,0.12)] border border-gray-100 overflow-hidden"
                    >
                      <div className="p-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-base font-bold text-slate-900 truncate">{shop.name}</p>
                            <div className="flex items-center gap-1">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                              <span className="text-sm font-semibold text-slate-700">{Number(shop.avg_rating || 0).toFixed(1)}</span>
                            </div>
                          </div>
                          {Array.isArray(shop.keywords) && shop.keywords.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500">
                              {shop.keywords.slice(0, 4).map((k) => (
                                <span key={k}>{k}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          aria-label="お気に入り"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(shop.id);
                          }}
                          className={`shrink-0 rounded-full p-2 transition-colors ${
                            favoriteShopIds.has(shop.id)
                              ? 'text-violet-500 bg-violet-50'
                              : 'text-slate-300 hover:text-violet-500 hover:bg-violet-50'
                          }`}
                        >
                          <svg 
                            width="18" 
                            height="18" 
                            viewBox="0 0 24 24" 
                            fill={favoriteShopIds.has(shop.id) ? 'currentColor' : 'none'} 
                            stroke="currentColor" 
                            strokeWidth="2.2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                        </button>
                      </div>

                      <div className="px-4 pb-3">
                        <div className="grid grid-cols-3 gap-2">
                          {photos.length > 0 ? (
                            photos.map((u, idx) => (
                              <div key={`${u}-${idx}`} className="h-20 rounded-xl overflow-hidden bg-gray-100">
                                <img src={u} alt={`${shop.name}-${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                              </div>
                            ))
                          ) : (
                            <div className="col-span-3 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-slate-400">no photo</div>
                          )}
                        </div>
                      </div>

                      <div className="px-4 pb-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">辛さレベル</span>
                            <span className="text-sm font-bold text-slate-900">{shop.spicy_level || 0}</span>
                          </div>
                          <div className="flex gap-1 w-[116px] justify-end">
                            {[1, 2, 3, 4, 5].map((lv) => (
                              <img key={lv} src={spiceIconDetail} alt="spicy" className={`w-5 h-5 ${lv <= (shop.spicy_level || 0) ? 'opacity-100' : 'opacity-25'}`} />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">清潔度</span>
                            <span className="text-sm font-bold text-slate-900">{shop.clean_level || 0}</span>
                          </div>
                          <div className="flex gap-1 w-[116px] justify-end">
                            {[1, 2, 3, 4, 5].map((lv) => (
                              <img key={lv} src={cleanlinessIconDetail} alt="clean" className={`w-5 h-5 ${lv <= (shop.clean_level || 0) ? 'opacity-100' : 'opacity-25'}`} />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">快適度</span>
                            <span className="text-sm font-bold text-slate-900">{shop.comfortable_level || 0}</span>
                          </div>
                          <div className="flex gap-1 w-[116px] justify-end">
                            {[1, 2, 3, 4, 5].map((lv) => (
                              <img key={lv} src={comfortIconDetail} alt="comfort" className={`w-5 h-5 ${lv <= (shop.comfortable_level || 0) ? 'opacity-100' : 'opacity-25'}`} />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">混雑度</span>
                            <span className="text-sm font-bold text-slate-900">{shop.congestion_level || 0}</span>
                          </div>
                          <div className="flex gap-1 w-[116px] justify-end">
                            {[1, 2, 3, 4, 5].map((lv) => (
                              <img key={lv} src={crowdIconDetail} alt="crowd" className={`w-5 h-5 object-contain ${lv <= (shop.congestion_level || 0) ? 'opacity-100' : 'opacity-25'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      
    </main>
  );
}

export default App;
