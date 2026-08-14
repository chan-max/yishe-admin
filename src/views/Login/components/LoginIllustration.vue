<template>
  <div class="login-illust">
    <svg viewBox="0 0 500 420" fill="none" xmlns="http://www.w3.org/2000/svg" class="login-illust__svg">
      <!-- Background circles -->
      <circle cx="250" cy="210" r="190" fill="#F0EDFF" opacity="0.4"/>
      <circle cx="250" cy="210" r="150" fill="#E8E4FF" opacity="0.5"/>
      
      <!-- Floating decorative elements -->
      <circle cx="110" cy="90" r="24" fill="#FFC857" opacity="0.8"/>
      <circle cx="410" cy="70" r="18" fill="#FF8FAB" opacity="0.7"/>
      <circle cx="70" cy="320" r="14" fill="#8367FF" opacity="0.6"/>
      <circle cx="430" cy="340" r="20" fill="#FFC857" opacity="0.5"/>
      <rect x="370" y="140" width="28" height="28" rx="6" fill="#635BFF" opacity="0.15" transform="rotate(15 384 154)"/>
      <rect x="50" y="200" width="24" height="24" rx="5" fill="#FF8FAB" opacity="0.2" transform="rotate(-10 62 212)"/>
      
      <!-- Laptop -->
      <g transform="translate(140, 110)">
        <!-- Screen -->
        <rect x="0" y="0" width="220" height="145" rx="14" fill="#635BFF"/>
        <rect x="12" y="12" width="196" height="115" rx="8" fill="white"/>
        <!-- Screen content -->
        <rect x="28" y="28" width="70" height="10" rx="5" fill="#E8E4FF"/>
        <rect x="28" y="46" width="140" height="7" rx="3.5" fill="#F0EDFF"/>
        <rect x="28" y="60" width="115" height="7" rx="3.5" fill="#F0EDFF"/>
        <rect x="28" y="74" width="90" height="7" rx="3.5" fill="#F0EDFF"/>
        <rect x="28" y="88" width="105" height="7" rx="3.5" fill="#F0EDFF"/>
        <!-- Code dots -->
        <circle cx="34" cy="108" r="5" fill="#FFC857"/>
        <circle cx="48" cy="108" r="5" fill="#FF8FAB"/>
        <circle cx="62" cy="108" r="5" fill="#8367FF"/>
        <!-- Keyboard -->
        <path d="M-12 145 L232 145 L244 168 L-24 168 Z" fill="#5548E8"/>
        <rect x="0" y="145" width="220" height="23" fill="#635BFF"/>
      </g>
      
      <!-- Person -->
      <g transform="translate(195, 200)">
        <!-- Head -->
        <circle cx="55" cy="0" r="34" fill="#FFC857"/>
        <!-- Body -->
        <path d="M22 35 Q55 30 88 35 L100 135 Q55 145 10 135 Z" fill="#635BFF"/>
        <!-- Arm -->
        <path d="M88 52 Q130 42 150 85 Q140 96 108 90 Z" fill="#8367FF"/>
      </g>
      
      <!-- Floating UI card 1 -->
      <g transform="translate(80, 290)">
        <rect x="0" y="0" width="90" height="45" rx="10" fill="white" stroke="#E8E4FF" stroke-width="2"/>
        <rect x="12" y="12" width="35" height="9" rx="4.5" fill="#635BFF" opacity="0.3"/>
        <rect x="12" y="27" width="55" height="7" rx="3.5" fill="#E8E4FF"/>
      </g>
      
      <!-- Floating UI card 2 -->
      <g transform="translate(340, 270)">
        <rect x="0" y="0" width="70" height="70" rx="14" fill="white" stroke="#E8E4FF" stroke-width="2"/>
        <circle cx="35" cy="35" r="18" fill="#FF8FAB" opacity="0.2"/>
        <path d="M26 35 L32 42 L44 28" stroke="#FF8FAB" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      
      <!-- Sparkles -->
      <g fill="#635BFF" opacity="0.6">
        <path d="M460 170 L466 182 L478 184 L466 186 L460 198 L454 186 L442 184 L454 182 Z"/>
      </g>
      <g fill="#FFC857" opacity="0.6">
        <path d="M40 110 L44 118 L52 120 L44 122 L40 130 L36 122 L28 120 L36 118 Z"/>
      </g>
      <g fill="#FF8FAB" opacity="0.6">
        <path d="M470 290 L474 298 L482 300 L474 302 L470 310 L466 302 L458 300 L466 298 Z"/>
      </g>
    </svg>
  </div>
</template>

<style lang="scss" scoped>
.login-illust {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 400px;
  padding: 20px;

  &__svg {
    width: 100%;
    max-width: 420px;
    height: auto;
    display: block;
    margin: 0 auto;
  }
}

// Tablet
@media (max-width: 1200px) {
  .login-illust {
    min-height: 300px;
    padding: 16px;

    &__svg {
      max-width: 320px;
    }
  }
}

// Mobile
@media (max-width: 768px) {
  .login-illust {
    min-height: 240px;
    padding: 12px;

    &__svg {
      max-width: 260px;
    }
  }
}
</style>
