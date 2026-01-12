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
import userIcon1 from './assets/images/user/user_icon_1.png';
import userIcon2 from './assets/images/user/user_icon_2.png';
import userIcon3 from './assets/images/user/user_icon_3.png';
import userIcon4 from './assets/images/user/user_icon_4.png';
import userIcon5 from './assets/images/user/user_icon_5.png';
import userIcon6 from './assets/images/user/user_icon_6.png';
import userIcon7 from './assets/images/user/user_icon_7.png';
import userIcon8 from './assets/images/user/user_icon_8.png';
import userIcon9 from './assets/images/user/user_icon_9.png';
import userIcon10 from './assets/images/user/user_icon_10.png';

const userIcons = [
  userIcon1, userIcon2, userIcon3, userIcon4, userIcon5,
  userIcon6, userIcon7, userIcon8, userIcon9, userIcon10
];

const getUserIcon = (avatar) => {
  if (!avatar) return userIcon1;
  const match = avatar.match(/user_icon_(\d+)\.png/);
  if (match) {
    const index = parseInt(match[1]) - 1;
    if (index >= 0 && index < userIcons.length) {
      return userIcons[index];
    }
  }
  return userIcon1;
};

// 都市カード
const cityCards = [
  { id: 'mumbai', title: 'Mumbai', image: mumbaiImg },
  { id: 'hyderabad', title: 'Hyderabad', image: delhiImg },
];

// ロックされたセクション
const lockedSections = [
  { id: 'personal', title: 'おすすめの場所' },
  { id: 'latest', title: '感性が似ているユーザーの口コミ' },
  { id: 'article', title: '記事' },
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
// 本番では VITE_API_BASE_URL を設定する、未設定の場合は同一オリジンを使用
const API_BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || '');

// city_id から座標を取得するヘルパー
const getCityCoordinates = (cityId) => {
  // city_id が不明な場合は Hyderabad をデフォルトにする
  return cityLocations[cityId] || cityLocations.hyderabad;
};

// 数値変換ヘルパー関数
const toNumberOrNull = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// PreferenceSelector コンポーネント（共通）
function PreferenceSelector({ title, bgImage, levels, value, onChange }) {
  return (
    <div className="space-y-3">
      <div className="relative rounded-xl bg-cover bg-center overflow-hidden" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="relative py-8">
          <h3 className="text-center text-2xl font-extrabold text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5), -1px -1px 2px rgba(0,0,0,0.3)' }}>{title}</h3>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between gap-2">
          {levels.buttons.map(({ level, color }) => (
            <button 
              key={level} 
              onClick={() => onChange(level)} 
              className={`flex-1 h-12 rounded-lg shadow-md flex items-center justify-center font-bold text-white text-base transition-all ${value === level ? color : 'bg-gray-300'}`}
            >
              {level}
            </button>
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
}

// 評価表示コンポーネント
function RatingDisplay({ label, value, icon, alt }) {
  return (
    <div className="flex flex-col gap-1.5">
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
  );
}

// キーワードリストコンポーネント
function KeywordsList({ keywords, className = "" }) {
  if (!Array.isArray(keywords) || keywords.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {keywords.map((kw, idx) => (
        <span key={`${kw}-${idx}`} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200">
          {kw}
        </span>
      ))}
    </div>
  );
}

function KeywordPicker({ keyword, setKeyword, availableKeywords, selectedKeywords, setSelectedKeywords, onSearch }) {
  const suggestions = useMemo(() => {
    const q = (keyword || '').trim();
    if (!q) return [];
    const lower = q.toLowerCase();
    return (availableKeywords || [])
      .filter((k) => !selectedKeywords?.includes(k))
      .filter((k) => k.toLowerCase().includes(lower))
      .slice(0, 8);
  }, [keyword, availableKeywords, selectedKeywords]);

  // 入力されたキーワードが availableKeywords に存在するかチェック
  const isKeywordInAvailable = useMemo(() => {
    const q = (keyword || '').trim();
    if (!q) return false;
    const lower = q.toLowerCase();
    return (availableKeywords || []).some((k) => k.toLowerCase() === lower);
  }, [keyword, availableKeywords]);

  const addKeyword = (kw) => {
    const v = (kw || '').trim();
    if (!v) return;
    setSelectedKeywords((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      return arr.includes(v) ? arr : [...arr, v];
    });
    setKeyword('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = (keyword || '').trim();
      if (!q) return;
      
      // 入力されたキーワードが availableKeywords に存在する場合、selectedKeywords に追加
      if (isKeywordInAvailable) {
        addKeyword(keyword);
      } else {
        // 存在しない場合、店名検索として使用（keyword パラメータで検索）
        if (onSearch) {
          onSearch();
        }
      }
    }
  };

  return (
    <div className="relative">
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full px-4 py-3 rounded-xl bg-violet-50 border-none focus:outline-none focus:ring-2 focus:ring-violet-300 text-sm"
        placeholder="キーワードを入力（Enterで検索/追加）"
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
        <div className="relative flex items-center gap-2">
          <input 
            type="range" 
            min="0" 
            max={category.max} 
            value={filters[category.id]} 
            onChange={(e) => onFilterChange(category.id, parseInt(e.target.value))} 
            className="flex-1 cursor-pointer" 
          />
          <svg 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke={isActive ? 'currentColor' : '#6b7280'} 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`}
            style={{ opacity: 0.7 }}
          >
            <path d="M9 18l-6-6 6-6M15 6l6 6-6 6" />
          </svg>
        </div>
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
          <button onClick={() => setIsCitySelectOpen(!isCitySelectOpen)} className={`w-full rounded-lg py-3 px-5 font-medium text-center text-sm transition-colors flex items-center justify-center gap-2 ${selectedCity ? 'bg-violet-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
            <span>{selectedCity ? selectedCity.name : '都市'}</span>
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={`transition-transform ${isCitySelectOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
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
            onSearch={onSearch}
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
                <li className="px-2 py-2">
                  <div className="text-xs font-semibold text-white/70 uppercase tracking-wider">管理者メニュー</div>
                </li>
                <li>
                  <button onClick={() => onNavigate('add-pin')} className="w-full flex items-center gap-4 text-white py-4 px-2 hover:bg-white/10 rounded-lg transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="text-base font-medium">ピン追加</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('articles')} className="w-full flex items-center gap-4 text-white py-4 px-2 hover:bg-white/10 rounded-lg transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      <path d="M8 7h8" />
                      <path d="M8 11h8" />
                      <path d="M8 15h6" />
                    </svg>
                    <span className="text-base font-medium">記事管理</span>
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
  
  // プロフィール設定状態
  const [profilePreferences, setProfilePreferences] = useState({
    spiceTolerance: null,
    cleanliness: null,
    comfort: null,
    crowd: null,
  });
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarSuccess, setAvatarSuccess] = useState('');
  
  // お気に入り状態
  const [favoriteShopIds, setFavoriteShopIds] = useState(new Set());
  const [favoriteShops, setFavoriteShops] = useState([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [favoriteArticleIds, setFavoriteArticleIds] = useState(new Set());
  const [favoriteArticles, setFavoriteArticles] = useState([]);
  const [isLoadingFavoriteArticles, setIsLoadingFavoriteArticles] = useState(false);
  
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
    text: '',
    spicy: '',
    clean: '',
    comfort: '',
    crowd: '',
    avg_rating: '',
  });
  // レビュー状態
  const [reviewsByShopId, setReviewsByShopId] = useState({});
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  
  // おすすめの場所（推薦店舗）状態
  const [recommendedShops, setRecommendedShops] = useState([]);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);
  
  // おすすめ店舗スライド関連状態
  const recommendedScrollRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  
  // 自作記事状態
  const [myArticles, setMyArticles] = useState([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  
  // 感性が似ているユーザーの口コミ状態
  const [recommendedReviews, setRecommendedReviews] = useState([]);
  const [isLoadingRecommendedReviews, setIsLoadingRecommendedReviews] = useState(false);
  
  // 記事管理ページ状態
  const [adminArticles, setAdminArticles] = useState([]);
  const [isLoadingAdminArticles, setIsLoadingAdminArticles] = useState(false);
  const [isArticleFormOpen, setIsArticleFormOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articleDetail, setArticleDetail] = useState(null);
  const [isLoadingArticleDetail, setIsLoadingArticleDetail] = useState(false);
  const [articleForm, setArticleForm] = useState({
    title: '',
    body: '',
    thumbnail_url: '',
    hashtags: [],
    status: 'draft',
  });
  const [hashtagInput, setHashtagInput] = useState('');

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
    setReviewForm({ text: '', spicy: '', clean: '', comfort: '', crowd: '', avg_rating: '' });
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

  // レビューを取得
  const loadReviews = async (shopId) => {
    if (!shopId) return;
    setIsLoadingReviews(true);
    try {
      const res = await fetch(`/review_json?shop_id=${shopId}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.reviews) {
          setReviewsByShopId((prev) => ({
            ...prev,
            [shopId]: data.reviews,
          }));
        }
      }
    } catch (error) {
      console.error('レビュー取得エラー:', error);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // 店舗が選択されたらレビューを読み込む
  useEffect(() => {
    if (selectedRestaurant?.id && isDetailOpen) {
      loadReviews(selectedRestaurant.id);
    }
  }, [selectedRestaurant?.id, isDetailOpen]);

  const currentReviews = useMemo(() => {
    const key = selectedRestaurant?.id;
    if (!key) return [];
    return Array.isArray(reviewsByShopId[key]) ? reviewsByShopId[key] : [];
  }, [reviewsByShopId, selectedRestaurant?.id]);

  const submitReview = async () => {
    if (!selectedRestaurant || !isLoggedIn) {
      setPreviousPage(currentPage);
      setCurrentPage('login');
      return;
    }

    const text = (reviewForm.text || '').trim();
    const isRestaurant = selectedRestaurant?.shop_type === 'restaurant';
    const spicy = isRestaurant ? Number(reviewForm.spicy) : null;
    const clean = Number(reviewForm.clean);
    const comfort = Number(reviewForm.comfort);
    const crowd = Number(reviewForm.crowd);
    const avg_rating = reviewForm.avg_rating !== '' ? Number(reviewForm.avg_rating) : null;
    
    if (!text) {
      alert('レビューを入力してください');
      return;
    }
    
    // 餐厅需要填写辣度，酒店和景点不需要
    const requiredFields = isRestaurant 
      ? [spicy, clean, comfort, crowd]
      : [clean, comfort, crowd];
    
    if (!requiredFields.every((n) => Number.isFinite(n) && n >= 1 && n <= 5)) {
      alert('すべての評価項目を選択してください');
      return;
    }
    if (avg_rating === null || !Number.isFinite(avg_rating) || avg_rating < 0 || avg_rating > 5) {
      alert('総合評価を選択してください（0-5の範囲、0.5刻み）');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('shop_id', String(selectedRestaurant.id));
      formData.append('text', text);
      if (isRestaurant) {
        formData.append('spicy', String(spicy));
      } else {
        formData.append('spicy', ''); // 非餐厅时发送空字符串
      }
      formData.append('clean', String(clean));
      formData.append('comfort', String(comfort));
      formData.append('crowd', String(crowd));
      formData.append('avg_rating', String(avg_rating));

      const res = await fetch('/review_json', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const responseText = await res.text();
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : { ok: false, error: '空のレスポンスが返されました' };
      } catch (e) {
        console.error('レスポンス解析エラー:', e);
        console.error('レスポンステキスト:', responseText);
        console.error('ステータスコード:', res.status);
        alert(`サーバーエラー: レスポンスの解析に失敗しました (${res.status})`);
        return;
      }

      if (data.ok) {
        // レビューを再取得
        await loadReviews(selectedRestaurant.id);
        setIsWriteReviewOpen(false);
        setReviewForm({ text: '', spicy: '', clean: '', comfort: '', crowd: '', avg_rating: '' });
      } else {
        console.error('レビュー投稿エラー:', data.error);
        alert(data.error || 'レビューの投稿に失敗しました');
      }
    } catch (error) {
      console.error('レビュー投稿エラー:', error);
      alert(`レビューの投稿に失敗しました: ${error.message || error}`);
    }
  };

  // お店検索（フィルターパネルの「検索」から呼ぶ）
   const searchShops = async (overrideSort, overrideQuery) => {
    try {
      setIsSearching(true);
      setSearchError(null);
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
        const apiUrl = `${API_BASE_URL}/api/restaurants`;
        const response = await fetch(apiUrl, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('レストランデータ取得失敗:', response.status, response.statusText, errorText);
          throw new Error(`データの取得に失敗しました (${response.status} ${response.statusText})`);
        }
        
        const contentType = response.headers.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('レストランデータ取得 - 予期しないContent-Type:', contentType, 'レスポンス:', text.substring(0, 200));
          throw new Error(`予期しないレスポンス形式: ${contentType}`);
        }
        
        const data = await response.json();

        // Neon/pg は NUMERIC を文字列で返すことがあるため数値へ正規化する
        // Google Maps の marker や表示整形が安定する
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
        
        // より詳細なエラーメッセージを表示
        let errorMessage = 'データの取得に失敗しました';
        if (error.message) {
          errorMessage = error.message;
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
          errorMessage = 'ネットワークエラー: サーバーに接続できませんでした';
        } else if (error.name === 'SyntaxError') {
          errorMessage = 'データの解析に失敗しました';
        }
        
        setRestaurantsError(errorMessage);
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

  // マップページでスクロールを無効化
  useEffect(() => {
    if (currentPage === 'map' || currentPage === 'detail') {
      // マップページでは body のスクロールを無効化
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      // 他のページではスクロールを有効化
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    
    // クリーンアップ関数
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
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
        setPreviousPage(currentPage);
        setCurrentPage('favorites');
      }
    } else if (pageId === 'profile') {
      if (!isLoggedIn) {
        setPreviousPage(currentPage);
        setCurrentPage('login');
      } else {
        setPreviousPage(currentPage);
        setCurrentPage('profile');
      }
    } else if (pageId === 'add-pin') {
      // ピン追加ページ（管理者のみメニューからアクセス可能）
      if (isAdmin) {
        setPreviousPage(currentPage);
        setSelectedUrlId(null); // URLリストに戻る
        setCurrentPage('add-pin');
      } else {
        // 一般ユーザーはアクセス不可
        alert('この機能は管理者専用です');
      }
    } else if (pageId === 'articles') {
      // 記事管理ページ（管理者のみメニューからアクセス可能）
      if (isAdmin) {
        setPreviousPage(currentPage);
        setCurrentPage('articles');
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
            // プロフィール設定を初期化
            if (data.user) {
              setProfilePreferences({
                spiceTolerance: data.user.spicy_level || null,
                cleanliness: data.user.clean_level || null,
                comfort: data.user.comfortable_level || null,
                crowd: data.user.congestion_level || null,
              });
              setSelectedAvatar(data.user.avatar || null);
            }
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
      
      // レスポンスステータスを確認
      if (!res.ok && res.status !== 400 && res.status !== 401) {
        throw new Error(`サーバーエラー: ${res.status} ${res.statusText}`);
      }
      
      // レスポンスが空でないことを確認
      const text = await res.text();
      if (!text) {
        throw new Error('空のレスポンスを受け取りました。サーバーが起動しているか確認してください。');
      }
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON解析エラー:', parseError, 'Response text:', text);
        console.error('Response status:', res.status);
        console.error('Response headers:', res.headers);
        throw new Error(`サーバーからのレスポンスの形式が正しくありません: ${text.substring(0, 100)}`);
      }
      
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
      setFavoriteArticleIds(new Set());
      setFavoriteArticles([]);
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

  // お気に入り記事を取得
  useEffect(() => {
    if (!isLoggedIn) {
      setFavoriteArticleIds(new Set());
      setFavoriteArticles([]);
      return;
    }

    const loadFavoriteArticles = async () => {
      setIsLoadingFavoriteArticles(true);
      try {
        const res = await fetch('/articles/favorites', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const ids = new Set(data.map((a) => a.id));
            setFavoriteArticleIds(ids);
            setFavoriteArticles(data);
          }
        }
      } catch (error) {
        console.error('お気に入り記事取得エラー:', error);
      } finally {
        setIsLoadingFavoriteArticles(false);
      }
    };

    loadFavoriteArticles();
  }, [isLoggedIn, currentPage]);

  // プロフィールページに入る時、現在のユーザー情報を読み込む
  useEffect(() => {
    if (currentPage === 'profile' && isLoggedIn && currentUser) {
      setProfilePreferences({
        spiceTolerance: currentUser.spicy_level || null,
        cleanliness: currentUser.clean_level || null,
        comfort: currentUser.comfortable_level || null,
        crowd: currentUser.congestion_level || null,
      });
      setSelectedAvatar(currentUser.avatar || null);
    }
  }, [currentPage, isLoggedIn, currentUser]);

  // おすすめの場所を取得
  useEffect(() => {
    const fetchRecommendedShops = async () => {
      if (!isLoggedIn || currentPage !== 'home') {
        setRecommendedShops([]);
        return;
      }

      setIsLoadingRecommended(true);
      try {
        const res = await fetch('/recommend/recommend_places', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.ok && Array.isArray(data.places)) {
            // データを正規化（restaurantsと同じ形式に）
            const normalized = data.places.slice(0, 5).map((shop) => ({
                ...shop,
                spicy_level: toNumberOrNull(shop.spicy_level),
                clean_level: toNumberOrNull(shop.clean_level),
                comfortable_level: toNumberOrNull(shop.comfortable_level),
                congestion_level: toNumberOrNull(shop.congestion_level),
              avg_rating: toNumberOrNull(shop.avg_rating),
              keywords: Array.isArray(shop.keywords) ? shop.keywords : [],
            }));
            setRecommendedShops(normalized);
          } else {
            setRecommendedShops([]);
          }
        } else {
          setRecommendedShops([]);
        }
      } catch (error) {
        console.error('おすすめ店舗取得エラー:', error);
        setRecommendedShops([]);
      } finally {
        setIsLoadingRecommended(false);
      }
    };

    fetchRecommendedShops();
  }, [currentPage, isLoggedIn, currentUser]);

  // 感性が似ているユーザーの口コミを取得
  useEffect(() => {
    const fetchRecommendedReviews = async () => {
      if (!isLoggedIn || currentPage !== 'home') {
        setRecommendedReviews([]);
        return;
      }

      setIsLoadingRecommendedReviews(true);
      try {
        const res = await fetch('/recommended', {
          credentials: 'include',
        });
        if (res.ok) {
          const reviews = await res.json();
          if (Array.isArray(reviews)) {
            // 各レビューに対応する店舗情報を取得
            const reviewsWithShops = await Promise.all(
              reviews.map(async (review) => {
                try {
                  // 店舗情報を取得（restaurants配列から検索）
                  const shop = restaurants.find((r) => r.id === review.shop_id);
                  return {
                    ...review,
                    shop: shop || null,
                  };
                } catch (error) {
                  console.error('店舗情報取得エラー:', error);
                  return {
                    ...review,
                    shop: null,
                  };
                }
              })
            );
            setRecommendedReviews(reviewsWithShops);
          } else {
            setRecommendedReviews([]);
          }
        } else {
          setRecommendedReviews([]);
        }
      } catch (error) {
        console.error('推薦レビュー取得エラー:', error);
        setRecommendedReviews([]);
      } finally {
        setIsLoadingRecommendedReviews(false);
      }
    };

    fetchRecommendedReviews();
  }, [currentPage, isLoggedIn, currentUser, restaurants]);

  // 記事詳細を開く（グローバル関数）
  const handleOpenArticleDetail = async (article) => {
    setSelectedArticle(article);
    setIsLoadingArticleDetail(true);
    try {
      const res = await fetch(`/articles/${article.id}`, { credentials: 'include' });
      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('記事詳細取得レスポンス解析エラー:', parseError, 'Response:', text);
        alert('記事の取得に失敗しました');
        setIsLoadingArticleDetail(false);
        return;
      }
      
        if (res.ok && data.id) {
          setArticleDetail(data);
          // お気に入り状態を更新
          if (data.is_favorite) {
            setFavoriteArticleIds(prev => new Set([...prev, data.id]));
          }
        } else {
          alert(data.error || '記事の取得に失敗しました');
        }
    } catch (error) {
      console.error('記事詳細取得エラー:', error);
      alert('記事の取得に失敗しました: ' + error.message);
    } finally {
      setIsLoadingArticleDetail(false);
    }
  };

  // 記事詳細を閉じる（グローバル関数）
  const handleCloseArticleDetail = () => {
    setSelectedArticle(null);
    setArticleDetail(null);
  };

  // 記事管理ページで記事一覧を取得
  useEffect(() => {
    if (currentPage === 'articles' && isAdmin && isLoggedIn) {
      const loadAdminArticles = async () => {
        setIsLoadingAdminArticles(true);
        try {
          const res = await fetch('/articles', {
            credentials: 'include',
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              setAdminArticles(data);
            } else {
              setAdminArticles([]);
            }
          } else {
            setAdminArticles([]);
          }
        } catch (error) {
          console.error('記事一覧取得エラー:', error);
          setAdminArticles([]);
        } finally {
          setIsLoadingAdminArticles(false);
        }
      };
      loadAdminArticles();
    }
  }, [currentPage, isAdmin, isLoggedIn]);

  // 記事一覧を取得（すべての公開記事）
  useEffect(() => {
    const fetchArticles = async () => {
      if (currentPage !== 'home') {
        setMyArticles([]);
        return;
      }

      setIsLoadingArticles(true);
      try {
        const res = await fetch('/articles', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setMyArticles(data);
          } else {
            setMyArticles([]);
          }
        } else {
          setMyArticles([]);
        }
      } catch (error) {
        console.error('記事取得エラー:', error);
        setMyArticles([]);
      } finally {
        setIsLoadingArticles(false);
      }
    };

    fetchArticles();
  }, [currentPage]);

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

  // 記事お気に入りに追加/削除
  const toggleArticleFavorite = async (articleId) => {
    if (!isLoggedIn) {
      setPreviousPage(currentPage);
      setCurrentPage('login');
      return;
    }

    const isFavorite = favoriteArticleIds.has(articleId);
    const method = isFavorite ? 'DELETE' : 'POST';
    
    try {
      const res = await fetch(`/articles/${articleId}/favorite`, {
        method,
        credentials: 'include',
      });

      const data = await res.json();
      if (data.ok) {
        const newIds = new Set(favoriteArticleIds);
        if (isFavorite) {
          newIds.delete(articleId);
          setFavoriteArticles((prev) => prev.filter((a) => a.id !== articleId));
        } else {
          newIds.add(articleId);
          // 記事情報を取得して追加
          const article = myArticles.find((a) => a.id === articleId) || 
                         (articleDetail && articleDetail.id === articleId ? articleDetail : null);
          if (article) {
            setFavoriteArticles((prev) => {
              if (prev.find((a) => a.id === articleId)) return prev;
              return [...prev, { ...article, is_favorite: true }];
            });
          } else {
            // 記事情報が見つからない場合は、お気に入り一覧を再取得
            const favRes = await fetch('/articles/favorites', {
              credentials: 'include',
            });
            if (favRes.ok) {
              const favData = await favRes.json();
              if (Array.isArray(favData)) {
                setFavoriteArticles(favData);
              }
            }
          }
        }
        setFavoriteArticleIds(newIds);
        
        // 記事詳細のis_favoriteも更新
        if (articleDetail && articleDetail.id === articleId) {
          setArticleDetail(prev => ({ ...prev, is_favorite: !isFavorite }));
        }
      } else {
        console.error('記事お気に入り操作エラー:', data.error);
        alert(data.error || 'お気に入りの操作に失敗しました');
      }
    } catch (error) {
      console.error('記事お気に入り操作エラー:', error);
      alert('お気に入りの操作に失敗しました');
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
          // プロフィール設定を初期化
          if (loginData.user) {
            setProfilePreferences({
              spiceTolerance: loginData.user.spicy_level || null,
              cleanliness: loginData.user.clean_level || null,
              comfort: loginData.user.comfortable_level || null,
              crowd: loginData.user.congestion_level || null,
            });
            setSelectedAvatar(loginData.user.avatar || null);
          }
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
              value={userPreferences.spiceTolerance}
              onChange={(level) => setUserPreferences(prev => ({ ...prev, spiceTolerance: level }))}
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
              value={userPreferences.cleanliness}
              onChange={(level) => setUserPreferences(prev => ({ ...prev, cleanliness: level }))}
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
              value={userPreferences.comfort}
              onChange={(level) => setUserPreferences(prev => ({ ...prev, comfort: level }))}
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
              value={userPreferences.crowd}
              onChange={(level) => setUserPreferences(prev => ({ ...prev, crowd: level }))}
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

  // アバター更新処理
  const handleUpdateAvatar = async () => {
    if (!selectedAvatar) {
      setAvatarError('アバターを選択してください');
      return;
    }
    
    setAvatarError('');
    setAvatarSuccess('');
    setIsUpdatingAvatar(true);
    
    try {
      const res = await fetch('/auth/update_profile_json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          avatar: selectedAvatar,
        }),
      });
      
      const data = await res.json();
      if (data.ok) {
        setCurrentUser(data.user);
        if (data.user) {
          setSelectedAvatar(data.user.avatar || null);
        }
        setAvatarSuccess('アバターを更新しました');
        setTimeout(() => setAvatarSuccess(''), 3000);
      } else {
        setAvatarError(data.error || 'アバターの更新に失敗しました');
      }
    } catch (error) {
      console.error('アバター更新エラー:', error);
      setAvatarError('アバターの更新に失敗しました');
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  // プロフィール更新処理（個人設定のみ）
  const handleUpdateProfile = async () => {
    if (!profilePreferences.spiceTolerance || !profilePreferences.cleanliness || !profilePreferences.comfort || !profilePreferences.crowd) {
      setProfileError('すべての評価項目を選択してください');
      return;
    }
    
    setProfileError('');
    setProfileSuccess('');
    setIsUpdatingProfile(true);
    
    try {
      const res = await fetch('/auth/update_profile_json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          spicy_level: profilePreferences.spiceTolerance,
          clean_level: profilePreferences.cleanliness,
          comfortable_level: profilePreferences.comfort,
          congestion_level: profilePreferences.crowd,
        }),
      });
      
      const data = await res.json();
      if (data.ok) {
        setCurrentUser(data.user);
        // プロフィール設定を更新
        if (data.user) {
          setProfilePreferences({
            spiceTolerance: data.user.spicy_level || null,
            cleanliness: data.user.clean_level || null,
            comfort: data.user.comfortable_level || null,
            crowd: data.user.congestion_level || null,
          });
        }
        setProfileSuccess('個人設定を更新しました');
        setTimeout(() => setProfileSuccess(''), 3000);
      } else {
        setProfileError(data.error || '個人設定の更新に失敗しました');
      }
    } catch (error) {
      console.error('個人設定更新エラー:', error);
      setProfileError('個人設定の更新に失敗しました');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // プロフィールページ
  if (currentPage === 'profile') {
    return (
      <main className="bg-white font-inter text-slate-900 w-full overflow-x-hidden">
        <div className="mx-auto max-w-md min-h-screen w-full">
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <button onClick={() => setCurrentPage(previousPage)} className="p-2" aria-label="戻る">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="flex-1 text-center text-lg font-semibold text-slate-900">個人情報</h1>
            <div className="w-10"></div>
          </div>
          <div className="px-8 py-6 space-y-8">
            {/* アバター設定セクション */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900">アバター設定</h2>
              {avatarError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-sm text-red-600">{avatarError}</p>
                </div>
              )}
              {avatarSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-sm text-green-600">{avatarSuccess}</p>
                </div>
              )}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">アバターを選択</label>
                <div className="grid grid-cols-5 gap-3">
                  {userIcons.map((icon, index) => {
                    const avatarName = `user_icon_${index + 1}.png`;
                    const isSelected = selectedAvatar === avatarName || (!selectedAvatar && index === 0);
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedAvatar(avatarName)}
                        className={`relative rounded-full overflow-hidden border-2 transition-all ${
                          isSelected ? 'border-violet-500 ring-2 ring-violet-200' : 'border-gray-200'
                        }`}
                      >
                        <img src={icon} alt={`アバター ${index + 1}`} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-violet-500/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <button 
                  onClick={handleUpdateAvatar}
                  disabled={isUpdatingAvatar}
                  className="w-full py-3 bg-violet-500 text-white font-semibold rounded-full shadow-lg hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingAvatar ? '更新中...' : 'アバターを更新'}
                </button>
              </div>
            </div>

            {/* 区切り線 */}
            <div className="border-t border-gray-200"></div>

            {/* 個人設定セクション */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900">個人設定のリセット</h2>
              {profileError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-sm text-red-600">{profileError}</p>
                </div>
              )}
              {profileSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-sm text-green-600">{profileSuccess}</p>
                </div>
              )}

            <PreferenceSelector 
              title="あなたの辛さ耐性は？" 
              bgImage={spiceBg} 
              value={profilePreferences.spiceTolerance}
              onChange={(level) => setProfilePreferences(prev => ({ ...prev, spiceTolerance: level }))}
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
              value={profilePreferences.cleanliness}
              onChange={(level) => setProfilePreferences(prev => ({ ...prev, cleanliness: level }))}
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
              value={profilePreferences.comfort}
              onChange={(level) => setProfilePreferences(prev => ({ ...prev, comfort: level }))}
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
              value={profilePreferences.crowd}
              onChange={(level) => setProfilePreferences(prev => ({ ...prev, crowd: level }))}
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

              <div className="!mt-8">
                <button 
                  onClick={handleUpdateProfile}
                  disabled={isUpdatingProfile}
                  className="w-full py-3 bg-violet-500 text-white font-semibold rounded-full shadow-lg hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingProfile ? '更新中...' : '個人設定を更新'}
                </button>
              </div>
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
            {!isLoggedIn ? (
              <div className="flex flex-col items-center justify-center py-16">
                <svg className="w-16 h-16 text-violet-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-slate-500 text-sm mb-2">ログインが必要です</p>
                <button
                  onClick={() => {
                    setPreviousPage('favorites');
                    setCurrentPage('login');
                  }}
                  className="mt-4 px-6 py-2 bg-violet-500 text-white rounded-full hover:bg-violet-600 transition-colors"
                >
                  ログイン
                </button>
              </div>
            ) : (isLoadingFavorites || isLoadingFavoriteArticles) ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-500">読み込み中...</p>
              </div>
            ) : (favoriteShops.length === 0 && favoriteArticles.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-16">
                <svg className="w-16 h-16 text-violet-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <p className="text-slate-500 text-sm">お気に入りがありません</p>
                <p className="text-slate-400 text-xs mt-2">気になる店舗や記事を追加してみましょう</p>
              </div>
            ) : (
              <div className="space-y-6 pb-6">
                {/* お気に入り記事 */}
                {favoriteArticles.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">お気に入り記事</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {favoriteArticles.map((article) => (
                        <div
                          key={article.id}
                          onClick={() => handleOpenArticleDetail(article)}
                          className="bg-white rounded-xl shadow-[0_4px_12px_rgba(15,23,42,0.1)] border border-gray-100 overflow-hidden hover:shadow-[0_6px_16px_rgba(15,23,42,0.15)] transition-all duration-300 cursor-pointer flex flex-col"
                        >
                          <div className="relative h-32 w-full bg-gradient-to-br from-violet-100 to-purple-200 flex-shrink-0">
                            {article.thumbnail_url ? (
                              <img
                                src={article.thumbnail_url}
                                alt={article.title}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="p-3 space-y-1 flex-1 flex flex-col">
                            <p className="text-xs font-semibold text-slate-900 line-clamp-2">{article.title}</p>
                            <p className="text-[10px] text-slate-500 mt-auto">{article.time_ago}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* お気に入り店舗 */}
                {favoriteShops.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">お気に入り店舗</h2>
                    <div className="space-y-4">
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
                  </div>
                )}
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
    const handleSelectUrl = async (urlData) => {
      setSelectedUrlId(urlData.id);
      
      // フォームのsource_urlを設定
      setPinForm(prev => ({
        ...prev,
        source_url: urlData.url,
      }));
      
      // submittedByUserIdをsessionStorageに保存
      if (urlData.submitted_by_user_id) {
        sessionStorage.setItem('submittedByUserId', urlData.submitted_by_user_id.toString());
      }
      
      // Google Maps URLから自動的に写真を取得
      if (urlData.url && urlData.url.includes('google.com/maps')) {
        try {
          const res = await fetch('/shop/get_shop_photo_from_url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ maps_url: urlData.url }),
          });
          
          if (!res.ok) {
            const errorText = await res.text();
            console.error('写真取得エラー:', res.status, errorText);
            // エラーがあっても処理を続行（写真がない場合も許可）
            return;
          }
          
          const data = await res.json();
          
          if (data.ok && data.photo_urls && data.photo_urls.length > 0) {
            // 写真URLを自動的にフォームに設定（最大3枚）
            const photoUrls = ['', '', ''];
            data.photo_urls.slice(0, 3).forEach((url, index) => {
              photoUrls[index] = url;
            });
            
            setPinForm(prev => ({
              ...prev,
              photo_urls: photoUrls,
            }));
            
            // 成功メッセージ（オプション）
            console.log(`${data.photo_urls.length}枚の写真を自動取得しました`);
          } else {
            console.log('写真が見つかりませんでした:', data.error || '不明なエラー');
          }
        } catch (error) {
          console.error('写真の取得に失敗しました:', error);
          // エラーがあっても処理を続行（写真がない場合も許可）
        }
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
            spicy_level: null,  // NULL - ユーザーレビューから計算
            clean_level: null,  // NULL - ユーザーレビューから計算
            comfortable_level: null,  // NULL - ユーザーレビューから計算
            congestion_level: null,  // NULL - ユーザーレビューから計算
            avg_rating: null,  // NULL - ユーザーレビューから計算
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
              <div className="bg-violet-50 rounded-xl p-4 space-y-3">
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
                <button
                  onClick={async () => {
                    if (!pinForm.source_url || !pinForm.source_url.includes('google.com/maps')) {
                      alert('Google Maps URLを選択してください');
                      return;
                    }
                    
                    try {
                      const res = await fetch('/shop/get_shop_info_from_url', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ maps_url: pinForm.source_url }),
                      });
                      
                      if (!res.ok) {
                        const errorText = await res.text();
                        console.error('店舗情報取得エラー:', res.status, errorText);
                        try {
                          const errorData = JSON.parse(errorText);
                          alert(errorData.error || `店舗情報の取得に失敗しました (${res.status})`);
                        } catch {
                          alert(`店舗情報の取得に失敗しました (${res.status})`);
                        }
                        return;
                      }
                      
                      const data = await res.json();
                      
                      if (data.ok) {
                        // 店舗名を設定
                        if (data.name) {
                          setPinForm(prev => ({ ...prev, name: data.name }));
                        }
                        
                        // 緯度・経度を設定
                        if (data.latitude && data.longitude) {
                          setPinForm(prev => ({
                            ...prev,
                            latitude: data.latitude.toString(),
                            longitude: data.longitude.toString(),
                          }));
                        }
                        
                        // 写真URLを設定（最大3枚）
                        if (data.photo_urls && data.photo_urls.length > 0) {
                          const photoUrls = ['', '', ''];
                          data.photo_urls.slice(0, 3).forEach((url, index) => {
                            photoUrls[index] = url;
                          });
                          setPinForm(prev => ({ ...prev, photo_urls: photoUrls }));
                        }
                        
                        alert('店舗情報を読み込みました！');
                      } else {
                        alert(data.error || '店舗情報の取得に失敗しました');
                      }
                    } catch (error) {
                      console.error('店舗情報取得エラー:', error);
                      alert('店舗情報の取得に失敗しました: ' + error.message);
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  URLから読み込む
                </button>
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

  // 記事管理ページ（管理者専用）
  if (currentPage === 'articles') {
    // 管理者チェック
    if (!isAdmin) {
      setCurrentPage('map');
      return null;
    }

    // 記事作成/編集フォームのハンドラー
    const handleOpenArticleForm = (article = null) => {
      if (article) {
        // 記事詳細を取得
        fetch(`/articles/${article.id}`, { credentials: 'include' })
          .then(async res => {
            const text = await res.text();
            let data;
            try {
              data = text ? JSON.parse(text) : {};
            } catch (parseError) {
              console.error('JSON解析エラー:', parseError, 'Response:', text);
              alert(`記事の取得に失敗しました: ${res.status} ${res.statusText}`);
              return;
            }
            
            if (!res.ok) {
              alert(data.error || `記事の取得に失敗しました: ${res.status}`);
              return;
            }
            
            if (data.id) {
              // hashtags の処理：PostgreSQL の配列はリストとして返される可能性がある
              let hashtagsArray = [];
              if (Array.isArray(data.hashtags)) {
                hashtagsArray = data.hashtags;
              } else if (data.hashtags) {
                // 文字列やその他の形式の場合
                try {
                  hashtagsArray = JSON.parse(data.hashtags);
                } catch {
                  hashtagsArray = [data.hashtags];
                }
              }
              
              setEditingArticle(data);
              setArticleForm({
                title: data.title || '',
                body: data.body || '',
                thumbnail_url: data.thumbnail_url || '',
                hashtags: hashtagsArray,
                status: data.status || 'draft',
              });
              setHashtagInput(''); // ハッシュタグ入力欄をクリア
              setIsArticleFormOpen(true);
            } else {
              console.error('記事データが不正です:', data);
              alert('記事データが不正です');
            }
          })
          .catch(err => {
            console.error('記事取得エラー:', err);
            alert('記事の取得に失敗しました: ' + err.message);
          });
      } else {
        setEditingArticle(null);
        setArticleForm({
          title: '',
          body: '',
          thumbnail_url: '',
          hashtags: [],
          status: 'draft',
        });
        setHashtagInput('');
        setIsArticleFormOpen(true);
      }
    };

    const handleCloseArticleForm = () => {
      setIsArticleFormOpen(false);
      setEditingArticle(null);
      setArticleForm({
        title: '',
        body: '',
        thumbnail_url: '',
        hashtags: [],
        status: 'draft',
      });
      setHashtagInput('');
    };

    const handleAddHashtag = () => {
      if (hashtagInput.trim() && !articleForm.hashtags.includes(hashtagInput.trim())) {
        setArticleForm(prev => ({
          ...prev,
          hashtags: [...prev.hashtags, hashtagInput.trim()],
        }));
        setHashtagInput('');
      }
    };

    const handleRemoveHashtag = (index) => {
      setArticleForm(prev => ({
        ...prev,
        hashtags: prev.hashtags.filter((_, i) => i !== index),
      }));
    };

    const handleUploadImage = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // ファイルサイズチェック（5MB以下）
      if (file.size > 5 * 1024 * 1024) {
        alert('画像サイズは5MB以下にしてください');
        return;
      }

      const formData = new FormData();
      formData.append('image', file);

      try {
        const res = await fetch('/upload-image', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        
        // レスポンステキストを先に取得
        const text = await res.text();
        let data;
        
        try {
          data = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.error('JSON解析エラー:', parseError, 'Response:', text);
          alert(`サーバーエラー: ${res.status} ${res.statusText}\n${text || '空のレスポンス'}`);
          return;
        }
        
        if (res.ok && data.ok && data.url) {
          setArticleForm(prev => ({ ...prev, thumbnail_url: data.url }));
          alert('画像のアップロードに成功しました');
        } else {
          alert(data.error || '画像のアップロードに失敗しました');
        }
      } catch (error) {
        console.error('画像アップロードエラー:', error);
        alert('画像のアップロードに失敗しました: ' + error.message);
      }
    };

    const handleSubmitArticle = async () => {
      if (!articleForm.title || !articleForm.body) {
        alert('タイトルと本文は必須です');
        return;
      }

      if (!articleForm.title.trim() || !articleForm.body.trim()) {
        alert('タイトルと本文を入力してください');
        return;
      }

      try {
        const url = editingArticle 
          ? `/articles/${editingArticle.id}`
          : '/articles';
        const method = editingArticle ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(articleForm),
        });

        let data;
        try {
          const text = await res.text();
          data = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.error('レスポンス解析エラー:', parseError);
          alert(`サーバーエラー: ${res.status} ${res.statusText}`);
          return;
        }

        if (res.ok && data.ok) {
          alert(editingArticle ? '記事を更新しました' : '記事を作成しました');
          handleCloseArticleForm();
          // 記事一覧を再取得（少し遅延を入れて確実に取得）
          setTimeout(async () => {
            try {
              const listRes = await fetch('/articles', { credentials: 'include' });
              if (listRes.ok) {
                const listData = await listRes.json();
                if (Array.isArray(listData)) {
                  setAdminArticles(listData);
                } else {
                  console.error('記事一覧が配列ではありません:', listData);
                  setAdminArticles([]);
                }
              } else {
                console.error('記事一覧取得失敗:', listRes.status, listRes.statusText);
              }
              
              // 自作記事一覧も再取得（ホームページで表示される）
              if (currentPage === 'home' || currentPage === 'articles') {
                try {
                  const myRes = await fetch('/articles/my', { credentials: 'include' });
                  if (myRes.ok) {
                    const myData = await myRes.json();
                    if (Array.isArray(myData)) {
                      setMyArticles(myData);
                    }
                  }
                } catch (error) {
                  console.error('自作記事一覧取得エラー:', error);
                }
              }
            } catch (error) {
              console.error('記事一覧取得エラー:', error);
            }
          }, 300);
        } else {
          alert(data.error || '記事の保存に失敗しました');
        }
      } catch (error) {
        console.error('記事保存エラー:', error);
        alert('記事の保存に失敗しました: ' + error.message);
      }
    };

    const handleDeleteArticle = async (articleId) => {
      if (!confirm('この記事を削除しますか？')) return;

      try {
        const res = await fetch(`/articles/${articleId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          alert('記事を削除しました');
          // 記事一覧を再取得
          const listRes = await fetch('/articles', { credentials: 'include' });
          if (listRes.ok) {
            const listData = await listRes.json();
            if (Array.isArray(listData)) {
              setAdminArticles(listData);
            }
          }
        } else {
          alert(data.error || '記事の削除に失敗しました');
        }
      } catch (error) {
        console.error('記事削除エラー:', error);
        alert('記事の削除に失敗しました');
      }
    };

    return (
      <main className="min-h-screen bg-white font-inter text-slate-900 w-full overflow-x-hidden">
        <div className="mx-auto max-w-md w-full">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <button onClick={() => setCurrentPage(previousPage)} className="p-2" aria-label="戻る">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-slate-900">記事管理</h1>
            <button 
              onClick={() => handleOpenArticleForm()} 
              className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
              aria-label="新規記事"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </button>
          </div>

          <div className="px-6 py-4">
            {isLoadingAdminArticles ? (
              <div className="text-center py-12 text-slate-500">読み込み中...</div>
            ) : adminArticles.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p className="mb-4">記事がありません</p>
                <button
                  onClick={() => handleOpenArticleForm()}
                  className="bg-violet-500 text-white px-6 py-2 rounded-full hover:bg-violet-600 transition-colors"
                >
                  新規記事を作成
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {adminArticles.map((article) => (
                  <div key={article.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      {article.thumbnail_url && (
                        <img 
                          src={article.thumbnail_url} 
                          alt={article.title}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-slate-900 line-clamp-2">{article.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
                            article.status === 'published' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {article.status === 'published' ? '公開' : '下書き'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">{article.time_ago}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenArticleForm(article)}
                            className="flex-1 bg-violet-500 text-white text-sm py-2 rounded-lg hover:bg-violet-600 transition-colors"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDeleteArticle(article.id)}
                            className="flex-1 bg-red-500 text-white text-sm py-2 rounded-lg hover:bg-red-600 transition-colors"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 記事作成/編集モーダル */}
        {isArticleFormOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6" onClick={handleCloseArticleForm}>
            <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingArticle ? '記事を編集' : '新規記事を作成'}
                </h2>
                <button onClick={handleCloseArticleForm} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 4L16 16M16 4L4 16" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">タイトル *</label>
                  <input
                    type="text"
                    value={articleForm.title}
                    onChange={(e) => setArticleForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="記事のタイトル"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">本文 *</label>
                  <textarea
                    value={articleForm.body}
                    onChange={(e) => setArticleForm(prev => ({ ...prev, body: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[200px] resize-none"
                    placeholder="記事の本文"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">サムネイル画像</label>
                  <div className="space-y-2">
                    {articleForm.thumbnail_url && (
                      <img src={articleForm.thumbnail_url} alt="Thumbnail" className="w-full h-48 object-cover rounded-lg" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadImage}
                      className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ハッシュタグ</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHashtag())}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="ハッシュタグを入力してEnter"
                    />
                    <button
                      onClick={handleAddHashtag}
                      className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
                    >
                      追加
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {articleForm.hashtags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-sm"
                      >
                        #{tag}
                        <button
                          onClick={() => handleRemoveHashtag(index)}
                          className="hover:text-violet-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ステータス</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setArticleForm(prev => ({ ...prev, status: 'draft' }))}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        articleForm.status === 'draft'
                          ? 'bg-amber-500 text-white shadow-md'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      }`}
                    >
                      下書き
                    </button>
                    <button
                      type="button"
                      onClick={() => setArticleForm(prev => ({ ...prev, status: 'published' }))}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        articleForm.status === 'published'
                          ? 'bg-green-500 text-white shadow-md'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      公開
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={handleCloseArticleForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSubmitArticle}
                  className="flex-1 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
                >
                  {editingArticle ? '更新' : '作成'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  // マップページ（検索結果オーバーレイもここで表示）
  if (currentPage === 'map' || currentPage === 'detail') {
    return (
      <main className="min-h-screen bg-white font-inter text-slate-900 w-full overflow-x-hidden overflow-y-hidden fixed inset-0">
        <div className="mx-auto max-w-md h-full flex flex-col relative w-full">
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
                  onClick={() => {
                    setPreviousPage('map');
                    setCurrentPage('profile');
                  }} 
                  className="absolute top-8 left-6 z-20"
                >
                  <img 
                    src={getUserIcon(currentUser.avatar)} 
                    alt={currentUser.name || currentUser.email}
                    className="w-12 h-12 rounded-full object-cover"
                  />
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
            <button onClick={() => {
              // 店舗の詳細カードが開いている場合は閉じる
              if (selectedRestaurant) {
                setSelectedRestaurant(null);
              }
              setIsMenuOpen(true);
            }} className="absolute top-8 right-6 z-20 rounded-md bg-violet-500 p-4 text-white shadow-lg hover:bg-violet-600 transition-colors" aria-label="メニュー">
            <div className="space-y-1.5">
              <span className="block h-[2.5px] w-4 rounded-full bg-white" />
              <span className="block h-[2.5px] w-6 rounded-full bg-white" />
              <span className="block h-[2.5px] w-4 rounded-full bg-white" />
            </div>
            </button>
          )}
          
          {/* 詳細ドロワーが開いている時もメニューボタンを表示し、クリックで閉じる */}
          {isDetailOpen && !isSearchOpen && (
            <button onClick={() => {
              // 詳細ドロワーを閉じる
              closeDetailPage();
              setIsMenuOpen(true);
            }} className="absolute top-8 right-6 z-20 rounded-md bg-violet-500 p-4 text-white shadow-lg hover:bg-violet-600 transition-colors" aria-label="メニュー">
            <div className="space-y-1.5">
              <span className="block h-[2.5px] w-4 rounded-full bg-white" />
              <span className="block h-[2.5px] w-6 rounded-full bg-white" />
              <span className="block h-[2.5px] w-4 rounded-full bg-white" />
            </div>
            </button>
          )}

          <div className="absolute inset-0" style={{ zIndex: 1 }}>
            {/* データ読み込み状態とエラー表示 */}
            {isLoadingRestaurants && (
              <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-30 bg-white/90 px-4 py-2 rounded-lg shadow-lg">
                <p className="text-sm text-slate-600">店舗データを読み込み中...</p>
              </div>
            )}
            {restaurantsError && (
              <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-30 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-sm">
                <p className="text-sm font-semibold mb-1">データ読み込みエラー</p>
                <p className="text-xs mb-2">{restaurantsError}</p>
                <button 
                  onClick={() => {
                    setRestaurantsError(null);
                    const fetchRestaurants = async () => {
                      setIsLoadingRestaurants(true);
                      setRestaurantsError(null);
                      try {
                        const apiUrl = `${API_BASE_URL}/api/restaurants`;
                        const response = await fetch(apiUrl, {
                          credentials: 'include',
                          headers: { 'Accept': 'application/json' },
                        });
                        if (!response.ok) {
                          throw new Error(`データの取得に失敗しました (${response.status})`);
                        }
                        const data = await response.json();
                        const restaurantsWithPosition = data.map(restaurant => {
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
                      } catch (error) {
                        setRestaurantsError(error.message || 'データの取得に失敗しました');
                        setRestaurants([]);
                      } finally {
                        setIsLoadingRestaurants(false);
                      }
                    };
                    fetchRestaurants();
                  }}
                  className="text-xs bg-red-200 hover:bg-red-300 px-3 py-1 rounded transition-colors"
                >
                  再試行
                </button>
              </div>
            )}
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
                    // 混雑度：数値が小さいほど空いている想定のため、上限でフィルタ
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
                        fillColor = '#059669'; // 緑色（ホテル）
                      } else if (restaurant.shop_type === 'spot') {
                        fillColor = '#dc2626'; // 赤色（スポット）
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

                  // position が有効かチェック
                  if (!restaurant.position || !restaurant.position.lat || !restaurant.position.lng) {
                    return null;
                  }

                  const icon = createCustomIcon();
                  if (!icon) {
                    return null;
                  }

                  return (
                    <Marker
                      key={restaurant.id}
                      position={restaurant.position}
                      title={`${restaurant.name} - 評価: ${restaurant.avg_rating || 'N/A'}`}
                      icon={icon}
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
          
          {/* 店舗詳細カード */}
          {!isDetailOpen && !isSearchOpen && selectedRestaurant && (
            <div
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out max-w-md mx-auto max-h-[70vh] overflow-y-auto hide-scrollbar"
            >
              {/* 閉じるボタン */}
              <button 
                onClick={() => setSelectedRestaurant(null)}
                className="absolute top-4 right-4 z-10 bg-black/60 rounded-full p-2 text-white hover:bg-black/80 transition-colors"
                aria-label="閉じる"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>

              {/* 店舗画像 - データベースの photo_url から取得 */}
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
                {/* プレースホルダー - 画像がない場合、または画像の読み込みに失敗した場合に表示 */}
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
                    {/* 店舗タイプ - データベースの shop_type から取得 */}
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

              {/* カルーセルインジケーター（複数画像の場合に表示） */}
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
                  <RatingDisplay label="辛さレベル" value={selectedRestaurant.spicy_level} icon={spiceIconDetail} alt="spicy" />
                  <RatingDisplay label="清潔度" value={selectedRestaurant.clean_level} icon={cleanlinessIconDetail} alt="cleanliness" />
                  <RatingDisplay label="快適度" value={selectedRestaurant.comfortable_level} icon={comfortIconDetail} alt="comfort" />
                  <RatingDisplay label="混雑度" value={selectedRestaurant.congestion_level} icon={crowdIconDetail} alt="crowd" />
                </div>
              </div>

              {/* キーワードタグ */}
              {selectedRestaurant.keywords && Array.isArray(selectedRestaurant.keywords) && selectedRestaurant.keywords.length > 0 && (
                <div className="px-6 pb-4">
                  <p className="text-sm text-gray-600 mb-2 font-medium">キーワード</p>
                  <KeywordsList keywords={selectedRestaurant.keywords} />
                </div>
              )}

              {/* 操作ボタン */}
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

          {/* 検索結果画面（フィルターメニューで検索を実行した後に表示） */}
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
              <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-md max-h-[90vh] bg-white rounded-t-3xl shadow-2xl overflow-y-auto hide-scrollbar pointer-events-auto flex flex-col" style={{ maxHeight: '90dvh' }}>
                {/* 固定された上部領域：画像、閉じるボタン、インジケーター */}
                <div className="sticky top-0 z-40 bg-white rounded-t-3xl">
                  {/* 画像 */}
                  <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-violet-100 to-purple-200">
                    {/* 固定位置の閉じるボタン - 常に画像の右上角に配置され、コンテンツのスクロールに伴わない */}
                    <button
                      onClick={closeDetailPage}
                      className="absolute top-4 right-4 z-[70] bg-black/60 rounded-full p-2 text-white hover:bg-black/80 transition-colors pointer-events-auto"
                      aria-label="閉じる"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>

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
                  
                  {/* インジケーター */}
                  {selectedRestaurantPhotoUrls.length > 1 && (
                    <div className="flex justify-center gap-2 py-4 bg-white">
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
                </div>

                {/* スクロール可能なコンテンツ領域 */}
                <div className="flex-1">
                  {/* レビューボタンとお気に入りボタン */}
                  <div className={`px-6 ${selectedRestaurantPhotoUrls.length > 1 ? 'pt-4' : 'pt-8'} pb-4 space-y-3`}>
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

                {/* キーワード */}
                {selectedRestaurant.keywords && Array.isArray(selectedRestaurant.keywords) && selectedRestaurant.keywords.length > 0 && (
                  <div className="px-6 pt-6">
                    <KeywordsList keywords={selectedRestaurant.keywords} />
                  </div>
                )}

                {/* 評価レベル */}
                <div className="px-6 pt-6">
                  <div className="grid grid-cols-2 gap-3">
                    <RatingDisplay label="辛さレベル" value={selectedRestaurant.spicy_level} icon={spiceIconDetail} alt="spicy" />
                    <RatingDisplay label="清潔度" value={selectedRestaurant.clean_level} icon={cleanlinessIconDetail} alt="cleanliness" />
                    <RatingDisplay label="快適度" value={selectedRestaurant.comfortable_level} icon={comfortIconDetail} alt="comfort" />
                    <RatingDisplay label="混雑度" value={selectedRestaurant.congestion_level} icon={crowdIconDetail} alt="crowd" />
                  </div>
                </div>

                  {/* ユーザーレビュー */}
                  <div className="px-6 pt-8 pb-32">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">口コミ</h4>
                    <span className="text-xs text-slate-500">{currentReviews.length} 件</span>
                  </div>

                  {isLoadingReviews ? (
                    <div className="mt-4 text-sm text-slate-500 text-center py-4">読み込み中...</div>
                  ) : currentReviews.length === 0 ? (
                    <div className="mt-4 text-sm text-slate-500">まだ口コミがありません。最初の口コミを書いてみましょう。</div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {currentReviews.map((r) => {
                        const reviewDate = r.review_time ? new Date(r.review_time).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/') : '';
                        return (
                          <div key={r.id}>
                            <div className="flex items-start gap-3">
                              <img 
                                src={getUserIcon(r.user_avatar)} 
                                alt={r.user_name || 'ユーザー'}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0 relative">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">{r.user_name || 'ユーザー'}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">口コミ書く日: {reviewDate}</p>
                                  </div>
                                  {r.avg_rating !== null && r.avg_rating !== undefined && (
                                    <div className="flex items-center gap-1 bg-gradient-to-br from-purple-400 to-purple-600 text-white px-2.5 py-1 rounded-lg shadow-sm flex-shrink-0">
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                      </svg>
                                      <span className="text-xs font-bold">{Number(r.avg_rating).toFixed(1)}</span>
                                    </div>
                                  )}
                                </div>
                                <p className="mt-2 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{r.user_review}</p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  {r.spicy_level !== null && r.spicy_level !== undefined && (
                                    <span className="text-xs px-2.5 py-1 rounded bg-red-500 text-white font-medium">辛さ {r.spicy_level}</span>
                                  )}
                                  {r.clean_level !== null && r.clean_level !== undefined && (
                                    <span className="text-xs px-2.5 py-1 rounded bg-blue-500 text-white font-medium">清潔度 {r.clean_level}</span>
                                  )}
                                  {r.comfortable_level !== null && r.comfortable_level !== undefined && (
                                    <span className="text-xs px-2.5 py-1 rounded bg-green-500 text-white font-medium">快適度 {r.comfortable_level}</span>
                                  )}
                                  {r.congestion_level !== null && r.congestion_level !== undefined && (
                                    <span className="text-xs px-2.5 py-1 rounded bg-amber-500 text-white font-medium">混雑度 {r.congestion_level}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  </div>
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

                        <div className={`mt-4 grid gap-2 ${selectedRestaurant?.shop_type === 'restaurant' ? 'grid-cols-4' : 'grid-cols-3'}`}>
                          {[
                            ...(selectedRestaurant?.shop_type === 'restaurant' ? [{ key: 'spicy', label: '辛さ' }] : []),
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
                          <label className="block text-white text-xs font-medium mb-2">総合評価（0-5の範囲、0.5刻み）</label>
                          <div className="flex items-center gap-3">
                            <input 
                              type="range" 
                              min="0" 
                              max="5" 
                              step="0.5"
                              value={reviewForm.avg_rating || 0}
                              onChange={(e) => setReviewForm((p) => ({ ...p, avg_rating: e.target.value }))}
                              className="flex-1 h-2 bg-white/30 rounded-lg appearance-none cursor-pointer"
                              style={{
                                background: `linear-gradient(to right, #fff 0%, #fff ${((reviewForm.avg_rating || 0) / 5) * 100}%, rgba(255,255,255,0.3) ${((reviewForm.avg_rating || 0) / 5) * 100}%, rgba(255,255,255,0.3) 100%)`
                              }}
                            />
                            <span className="text-white text-sm font-bold w-12 text-center">{Number(reviewForm.avg_rating || 0).toFixed(1)}</span>
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
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCity?.name || getCurrentCity())}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-violet-500 px-6 py-4 flex items-center justify-between hover:bg-violet-600 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <h3 className="text-white font-bold text-lg">Google Maps</h3>
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
                onClick={() => {
                  setPreviousPage('home');
                  setCurrentPage('profile');
                }} 
                className=""
              >
                <img 
                  src={getUserIcon(currentUser.avatar)} 
                  alt={currentUser.name || currentUser.email}
                  className="w-12 h-12 rounded-full object-cover"
                />
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
            {lockedSections.map((section) => {
              // おすすめの場所セクション
              if (section.id === 'personal') {
                return (
                  <div key={section.id} className="space-y-3">
                    <p className="text-sm font-medium text-slate-700">{section.title}</p>
                    {!isLoggedIn ? (
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
                    ) : (
                      <>
                        {isLoadingRecommended ? (
                          <div className="text-center py-4 text-sm text-slate-500">読み込み中...</div>
                        ) : recommendedShops.length === 0 ? (
                          <div className="text-center py-4 text-sm text-slate-500">おすすめの店舗がありません</div>
                        ) : (
                          <div className="relative -mx-2 px-2">
                            <div 
                              ref={recommendedScrollRef}
                              className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar cursor-grab active:cursor-grabbing select-none"
                              style={{
                                scrollBehavior: 'smooth',
                                WebkitOverflowScrolling: 'touch',
                                touchAction: 'pan-x',
                              }}
                              onMouseDown={(e) => {
                                if (e.button !== 0) return; // 只处理左键
                                isDraggingRef.current = true;
                                startXRef.current = e.pageX - (recommendedScrollRef.current?.offsetLeft || 0);
                                scrollLeftRef.current = recommendedScrollRef.current?.scrollLeft || 0;
                                if (recommendedScrollRef.current) {
                                  recommendedScrollRef.current.style.cursor = 'grabbing';
                                }
                                e.preventDefault();
                              }}
                              onMouseLeave={() => {
                                isDraggingRef.current = false;
                                if (recommendedScrollRef.current) {
                                  recommendedScrollRef.current.style.cursor = 'grab';
                                }
                              }}
                              onMouseUp={() => {
                                isDraggingRef.current = false;
                                if (recommendedScrollRef.current) {
                                  recommendedScrollRef.current.style.cursor = 'grab';
                                }
                              }}
                              onMouseMove={(e) => {
                                if (!isDraggingRef.current || !recommendedScrollRef.current) return;
                                e.preventDefault();
                                const x = e.pageX - (recommendedScrollRef.current.offsetLeft || 0);
                                const walk = (x - startXRef.current) * 2; // 滑动速度倍数
                                recommendedScrollRef.current.scrollLeft = scrollLeftRef.current - walk;
                              }}
                            >
                              {recommendedShops.map((shop, index) => {
                                const photos = parsePhotoUrls(shop.photo_url);
                                const firstPhoto = photos[0] || '';
                                
                                return (
                                  <button
                                    key={shop.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedRestaurant(shop);
                                      if (shop.latitude && shop.longitude) {
                                        setMapLocation({ lat: shop.latitude, lng: shop.longitude });
                                      }
                                      setCurrentPage('map');
                                    }}
                                    className="flex-shrink-0 w-[140px] bg-white rounded-xl shadow-[0_4px_12px_rgba(15,23,42,0.1)] border border-gray-100 overflow-hidden hover:shadow-[0_6px_16px_rgba(15,23,42,0.15)] transition-all duration-300 hover:scale-105 hover:-translate-y-1 flex flex-col"
                                    style={{
                                      animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                                    }}
                                  >
                                    {/* 画像 - 始终到顶 */}
                                    <div className="relative h-24 w-full bg-gradient-to-br from-violet-100 to-purple-200 flex-shrink-0">
                                      {firstPhoto ? (
                                        <img
                                          src={firstPhoto}
                                          alt={shop.name}
                                          className="w-full h-full object-cover"
                                          referrerPolicy="no-referrer"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                        </div>
                                      )}
                                    </div>
                                    {/* 情報 */}
                                    <div className="p-2.5 space-y-1.5 flex-1 flex flex-col">
                                    {/* 店名 - 1行のみ、長すぎる場合は切り詰め */}
                                    <p className="text-xs font-semibold text-slate-900 truncate">{shop.name}</p>
                                    
                                    {/* 評価 - 店名の下 */}
                                    {shop.avg_rating !== null && shop.avg_rating !== undefined && (
                                      <div className="flex items-center gap-0.5">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2">
                                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                        <span className="text-xs font-semibold text-slate-700">{Number(shop.avg_rating).toFixed(1)}</span>
                                      </div>
                                    )}
                                    
                                    {/* キーワード - 評価の下、最大2つ */}
                                    {Array.isArray(shop.keywords) && shop.keywords.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-auto">
                                          {shop.keywords.slice(0, 2).map((kw, idx) => (
                                            <span key={`${kw}-${idx}`} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 font-medium">
                                              {kw}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </button>
                              );
                            })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              }
              
              // 記事セクション
              if (section.id === 'article') {
                return (
                  <div key={section.id} className="space-y-3">
                    <p className="text-sm font-medium text-slate-700">{section.title}</p>
                    {isLoadingArticles ? (
                      <div className="text-center py-4 text-sm text-slate-500">読み込み中...</div>
                    ) : myArticles.length === 0 ? (
                      <div className="text-center py-4 text-sm text-slate-500">記事がありません</div>
                    ) : (
                          <div className="relative -mx-2 px-2">
                            <div 
                              className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar"
                              style={{
                                scrollBehavior: 'smooth',
                                WebkitOverflowScrolling: 'touch',
                              }}
                            >
                              {myArticles.map((article, index) => (
                                <div
                                  key={article.id}
                                  className="flex-shrink-0 w-[140px] bg-white rounded-xl shadow-[0_4px_12px_rgba(15,23,42,0.1)] border border-gray-100 overflow-hidden hover:shadow-[0_6px_16px_rgba(15,23,42,0.15)] transition-all duration-300 hover:scale-105 hover:-translate-y-1 flex flex-col"
                                  style={{
                                    animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                                  }}
                                >
                                  {/* 画像 */}
                                  <div 
                                    className="relative h-24 w-full bg-gradient-to-br from-violet-100 to-purple-200 flex-shrink-0 cursor-pointer"
                                    onClick={() => handleOpenArticleDetail(article)}
                                  >
                                    {article.thumbnail_url ? (
                                      <img
                                        src={article.thumbnail_url}
                                        alt={article.title}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                      </div>
                                    )}
                                    {/* お気に入りボタン */}
                                    {isLoggedIn && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleArticleFavorite(article.id);
                                        }}
                                        className={`absolute top-1 right-1 p-1.5 rounded-full transition-colors ${
                                          (article.is_favorite || favoriteArticleIds.has(article.id))
                                            ? 'bg-violet-500 text-white'
                                            : 'bg-white/80 text-gray-600 hover:bg-white'
                                        }`}
                                        aria-label="お気に入り"
                                      >
                                        <svg 
                                          width="14" 
                                          height="14" 
                                          viewBox="0 0 24 24" 
                                          fill={(article.is_favorite || favoriteArticleIds.has(article.id)) ? 'currentColor' : 'none'} 
                                          stroke="currentColor" 
                                          strokeWidth="2.5" 
                                          strokeLinecap="round" 
                                          strokeLinejoin="round"
                                        >
                                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                  {/* 情報 */}
                                  <div 
                                    className="p-2.5 space-y-1.5 flex-1 flex flex-col cursor-pointer"
                                    onClick={() => handleOpenArticleDetail(article)}
                                  >
                                    <p className="text-xs font-semibold text-slate-900 line-clamp-2">{article.title}</p>
                                    <p className="text-[10px] text-slate-500 mt-auto">{article.time_ago}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                  </div>
                );
              }
              
              // 感性が似ているユーザーの口コミセクション
              if (section.id === 'latest') {
                return (
                  <div key={section.id} className="space-y-3">
                    <p className="text-sm font-medium text-slate-700">{section.title}</p>
                    {!isLoggedIn ? (
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
                    ) : (
                      <>
                        {isLoadingRecommendedReviews ? (
                          <div className="text-center py-4 text-sm text-slate-500">読み込み中...</div>
                        ) : recommendedReviews.length === 0 ? (
                          // UIテンプレート（デザイン確認用）
                          <div className="space-y-2">
                            {[
                              {
                                date: '2025.03.15',
                                reviewer_name: '田中太郎',
                                match_percent: 92,
                                shop_type: 'restaurant',
                                review: '辛さがちょうどよくて、とても美味しかったです！清潔感もあり、快適に食事できました。'
                              },
                              {
                                date: '2025.03.10',
                                reviewer_name: '佐藤花子',
                                match_percent: 85,
                                shop_type: 'hotel',
                                review: '混雑していましたが、味は最高でした。また行きたいです。'
                              },
                              {
                                date: '2025.03.05',
                                reviewer_name: '鈴木一郎',
                                match_percent: 78,
                                shop_type: 'spot',
                                review: '快適な空間で、美味しいカレーを楽しめました。'
                              }
                            ].map((template, index) => {
                              const getShopTypeLabel = (type) => {
                                if (type === 'restaurant') return '飲食店';
                                if (type === 'hotel') return 'ホテル';
                                if (type === 'spot') return 'スポット';
                                return type;
                              };
                              
                              return (
                                <div
                                  key={`template-${index}`}
                                  className="bg-white rounded-lg border border-gray-200 p-3 opacity-60 relative"
                                >
                                  {/* 右上角：店铺类型 */}
                                  {template.shop_type && (
                                    <div className="absolute top-3 right-3">
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                                        {getShopTypeLabel(template.shop_type)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-start gap-4 pr-16">
                                    {/* 左側：日付 */}
                                    <div className="flex-shrink-0 w-20">
                                      <span className="text-xs font-medium text-blue-600">{template.date}</span>
                                    </div>
                                    {/* 右側：内容 */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="text-xs font-medium text-slate-900">{template.reviewer_name}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 font-semibold">
                                          {template.match_percent}% マッチ
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-700 line-clamp-1">
                                        {template.review}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            <div className="text-center py-2 mt-2">
                              <p className="text-xs text-slate-400 italic">※ これはUIデザインのテンプレートです</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {recommendedReviews.slice(0, 5).map((review, index) => {
                              const shop = review.shop;
                              const reviewDate = review.review_time 
                                ? new Date(review.review_time).toLocaleDateString('ja-JP', { 
                                    year: 'numeric', 
                                    month: '2-digit', 
                                    day: '2-digit' 
                                  }).replace(/\//g, '.')
                                : '';
                              
                              const getShopTypeLabel = (type) => {
                                if (type === 'restaurant') return '飲食店';
                                if (type === 'hotel') return 'ホテル';
                                if (type === 'spot') return 'スポット';
                                return type || '';
                              };
                              
                              return (
                                <button
                                  key={review.review_id}
                                  type="button"
                                  onClick={() => {
                                    if (shop) {
                                      setSelectedRestaurant(shop);
                                      if (shop.latitude && shop.longitude) {
                                        setMapLocation({ lat: shop.latitude, lng: shop.longitude });
                                      }
                                      setCurrentPage('map');
                                    }
                                  }}
                                  className="w-full text-left bg-white rounded-lg border border-gray-200 p-3 hover:bg-gray-50 hover:border-gray-300 transition-all relative"
                                >
                                  {/* 右上角：店铺类型 */}
                                  {shop && shop.shop_type && (
                                    <div className="absolute top-3 right-3">
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                                        {getShopTypeLabel(shop.shop_type)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-start gap-4 pr-16">
                                    {/* 左側：日付 */}
                                    <div className="flex-shrink-0 w-20">
                                      <span className="text-xs font-medium text-blue-600">{reviewDate || '日付不明'}</span>
                                    </div>
                                    {/* 右側：内容 */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="text-xs font-medium text-slate-900">
                                          {review.reviewer_name || '匿名ユーザー'}
                                        </span>
                                        {review.match_percent !== undefined && (
                                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 font-semibold">
                                            {review.match_percent}% マッチ
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-700 line-clamp-1">
                                        {review.review || 'レビューなし'}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              }
              
              // その他のセクション
              return (
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
              );
            })}
          </div>
        </div>

        {/* おすすめの場所のアニメーション用CSS */}
        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

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

      {/* 記事詳細ページ */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-slate-50 to-white">
          <div className="h-full max-w-3xl mx-auto bg-white shadow-xl overflow-y-auto">
            {/* ヘッダー */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-10 px-6 py-4 flex items-center justify-between shadow-sm">
              <button
                onClick={handleCloseArticleDetail}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="閉じる"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-slate-900">記事詳細</h1>
              <div className="w-10"></div>
            </div>

            {/* コンテンツ */}
            {isLoadingArticleDetail ? (
              <div className="flex items-center justify-center py-32">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="text-slate-500 text-sm">読み込み中...</div>
                </div>
              </div>
            ) : articleDetail ? (
              <div className="px-6 py-8 space-y-8">
                {/* サムネイル画像 */}
                {articleDetail.thumbnail_url && (
                  <div className="w-full h-80 bg-gradient-to-br from-violet-100 via-purple-100 to-pink-100 rounded-3xl overflow-hidden shadow-lg">
                    <img
                      src={articleDetail.thumbnail_url}
                      alt={articleDetail.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        console.error('画像の読み込みに失敗しました:', articleDetail.thumbnail_url);
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-slate-400"><svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>';
                      }}
                    />
                  </div>
                )}

                {/* タイトルとメタ情報 */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-4 leading-tight">{articleDetail.title}</h2>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{articleDetail.time_ago || articleDetail.created_at}</span>
                        </div>
                        {articleDetail.status === 'draft' && (
                          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold">下書き</span>
                        )}
                      </div>
                      {/* お気に入りボタン */}
                      {isLoggedIn && (
                        <button
                          onClick={() => toggleArticleFavorite(articleDetail.id)}
                          className={`p-2 rounded-full transition-colors ${
                            (articleDetail.is_favorite || favoriteArticleIds.has(articleDetail.id))
                              ? 'bg-violet-100 text-violet-600 hover:bg-violet-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          aria-label="お気に入り"
                        >
                          <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill={(articleDetail.is_favorite || favoriteArticleIds.has(articleDetail.id)) ? 'currentColor' : 'none'} 
                            stroke="currentColor" 
                            strokeWidth="2.2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ハッシュタグ */}
                  {articleDetail.hashtags && Array.isArray(articleDetail.hashtags) && articleDetail.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {articleDetail.hashtags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 本文 */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="prose prose-slate max-w-none">
                    <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-base">
                      {articleDetail.body}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-32">
                <div className="text-center space-y-3">
                  <svg className="w-16 h-16 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-slate-500">記事が見つかりませんでした</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
