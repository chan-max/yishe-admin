<template>
  <el-form
    v-show="getShow"
    ref="formLogin"
    :model="loginData.loginForm"
    :rules="LoginRules"
    class="login-form"
    label-position="top"
    label-width="120px"
    size="large"
  >
    <el-row style="margin-right: -10px; margin-left: -10px">
      <el-col :span="24" style="padding-right: 10px; padding-left: 10px">
        <el-form-item>
          <LoginFormTitle style="width: 100%" />
        </el-form-item>
      </el-col>
      <el-col :span="24" style="padding-right: 10px; padding-left: 10px">
        <el-form-item v-if="loginData.tenantEnable === 'true'" prop="tenantName">
          <el-input
            v-model="loginData.loginForm.tenantName"
            :placeholder="t('login.tenantNamePlaceholder')"
            :prefix-icon="iconHouse"
            link
            type="primary"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24" style="padding-right: 10px; padding-left: 10px">
        <el-form-item prop="account">
          <el-input
            v-model="loginData.loginForm.account"
            :placeholder="t('login.accountPlaceholder')"
            :prefix-icon="iconAvatar"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24" style="padding-right: 10px; padding-left: 10px">
        <el-form-item prop="password">
          <el-input
            v-model="loginData.loginForm.password"
            :placeholder="t('login.passwordPlaceholder')"
            :prefix-icon="iconLock"
            show-password
            type="password"
            @keyup.enter="handleLogin()"
          />
        </el-form-item>
      </el-col>
      <el-col
        :span="24"
        style="
          padding-right: 10px;
          padding-left: 10px;
          margin-top: -20px;
          margin-bottom: -20px;
        "
      >
        <el-form-item>
          <el-row justify="space-between" style="width: 100%">
            <el-col :span="6">
              <el-checkbox v-model="loginData.loginForm.rememberMe">
                {{ t("login.remember") }}
              </el-checkbox>
            </el-col>
            <el-col :offset="6" :span="12">
              <el-link
                style="float: right"
                type="primary"
                @click="setLoginState(LoginStateEnum.RESET_PASSWORD)"
              >
                {{ t("login.forgetPassword") }}
              </el-link>
            </el-col>
          </el-row>
        </el-form-item>
      </el-col>
      <el-col :span="24" style="padding-right: 10px; padding-left: 10px">
        <el-form-item>
          <XButton
            :loading="loginLoading"
            :title="t('login.login')"
            class="w-[100%]"
            type="primary"
            @click="handleLogin()"
          />
        </el-form-item>
      </el-col>
      <!-- <el-col :span="24" style="padding-right: 10px; padding-left: 10px">
        <el-form-item>
          <el-row :gutter="5" justify="space-between" style="width: 100%">
            <el-col :span="8">
              <XButton
                :title="t('login.btnMobile')"
                class="w-[100%]"
                @click="setLoginState(LoginStateEnum.MOBILE)"
              />
            </el-col>
            <el-col :span="8">
              <XButton
                :title="t('login.btnQRCode')"
                class="w-[100%]"
                @click="setLoginState(LoginStateEnum.QR_CODE)"
              />
            </el-col>
            <el-col :span="8">
              <XButton
                :title="t('login.btnRegister')"
                class="w-[100%]"
                @click="setLoginState(LoginStateEnum.REGISTER)"
              />
            </el-col>
          </el-row>
        </el-form-item>
      </el-col> -->
      <!-- <el-divider content-position="center">{{ t('login.otherLogin') }}</el-divider>
      <el-col :span="24" style="padding-right: 10px; padding-left: 10px">
        <el-form-item>
          <div class="w-[100%] flex justify-between">
            <Icon
              v-for="(item, key) in socialList"
              :key="key"
              :icon="item.icon"
              :size="30"
              class="anticon cursor-pointer"
              color="#999"
              @click="doSocialLogin(item.type)"
            />
          </div>
        </el-form-item>
      </el-col>
      <el-divider content-position="center">萌新必读</el-divider>
      <el-col :span="24" style="padding-right: 10px; padding-left: 10px">
        <el-form-item>
          <div class="w-[100%] flex justify-between">
            <el-link href="https://doc.iocoder.cn/" target="_blank">📚开发指南</el-link>
            <el-link href="https://doc.iocoder.cn/video/" target="_blank">🔥视频教程</el-link>
            <el-link href="https://www.iocoder.cn/Interview/good-collection/" target="_blank">
              ⚡面试手册
            </el-link>
            <el-link href="http://static.yudao.iocoder.cn/mp/Aix9975.jpeg" target="_blank">
              🤝外包咨询
            </el-link>
          </div>
        </el-form-item>
      </el-col> -->
    </el-row>
  </el-form>
</template>
<script lang="ts" setup>
import { ElLoading } from "element-plus";
import LoginFormTitle from "./LoginFormTitle.vue";
import type { RouteLocationNormalizedLoaded } from "vue-router";

import { useIcon } from "@/hooks/web/useIcon";

import * as authUtil from "@/utils/auth";
import { usePermissionStoreWithOut } from "@/store/modules/permission";
import * as LoginApi from "@/api/login";
import { LoginStateEnum, useFormValid, useLoginState } from "./useLogin";
import { useUserStoreWithOut } from "@/store/modules/user";
import { setAccessToken } from "@/utils/auth";

defineOptions({ name: "LoginForm" });

const { t } = useI18n();
const message = useMessage();
const iconHouse = useIcon({ icon: "ep:house" });
const iconAvatar = useIcon({ icon: "ep:avatar" });
const iconLock = useIcon({ icon: "ep:lock" });
const formLogin = ref();
const { validForm } = useFormValid(formLogin);
const { setLoginState, getLoginState } = useLoginState();
const { currentRoute, push } = useRouter();
const redirect = ref<string>("");
const loginLoading = ref(false);
const loading = ref(); // ElLoading.service 返回的实例

const getShow = computed(() => unref(getLoginState) === LoginStateEnum.LOGIN);

const LoginRules = {
  tenantName: [required],
  account: [required],
  password: [required],
};
const loginData = reactive({
  isShowPassword: false,
  tenantEnable: import.meta.env.VITE_APP_TENANT_ENABLE,
  loginForm: {
    // tenantName: import.meta.env.VITE_APP_DEFAULT_LOGIN_TENANT || "",
    account: import.meta.env.VITE_APP_DEFAULT_LOGIN_USERNAME || "",
    password: import.meta.env.VITE_APP_DEFAULT_LOGIN_PASSWORD || "",
    // rememberMe: true, // 默认记录我。如果不需要，可手动修改
  },
});

// const socialList = [
//   { icon: 'ant-design:wechat-filled', type: 30 },
//   { icon: 'ant-design:dingtalk-circle-filled', type: 20 },
//   { icon: 'ant-design:github-filled', type: 0 },
//   { icon: 'ant-design:alipay-circle-filled', type: 0 }
// ]

// 获取验证码
// const getCode = async () => {
//   // 情况一，未开启：则直接登录
//   if (loginData.captchaEnable === 'false') {
//     await handleLogin({})
//   } else {
//     // 情况二，已开启：则展示验证码；只有完成验证码的情况，才进行登录
//     // 弹出验证码
//     verify.value.show()
//   }
// }
// 获取租户 ID
// const getTenantId = async () => {
//   if (loginData.tenantEnable === 'true') {
//     const res = await LoginApi.getTenantIdByName(loginData.loginForm.tenantName)
//     authUtil.setTenantId(res)
//   }
// }
// 记住我
const getLoginFormCache = () => {
  const loginForm = authUtil.getLoginForm();
  if (loginForm) {
    loginData.loginForm = {
      ...loginData.loginForm,
      account: loginForm.account ? loginForm.account : loginData.loginForm.account,
      password: loginForm.password ? loginForm.password : loginData.loginForm.password,
      rememberMe: loginForm.rememberMe,
      tenantName: loginForm.tenantName
        ? loginForm.tenantName
        : loginData.loginForm.tenantName,
    };
  }
};
// 根据域名，获得租户信息
// const getTenantByWebsite = async () => {
//   const website = location.host
//   const res = await LoginApi.getTenantByWebsite(website)
//   if (res) {
//     loginData.loginForm.tenantName = res.name
//     authUtil.setTenantId(res.id)
//   }
// }

// 登录
const handleLogin = async () => {
  loginLoading.value = true;
  try {
    const data = await validForm();
    if (!data) {
      return;
    }

    const loginDataLoginForm = { ...loginData.loginForm };
    const res = await LoginApi.login(loginDataLoginForm);
    if (!res) {
      return;
    }
    loading.value = ElLoading.service({
      lock: true,
      text: "正在加载系统中...",
      background: "rgba(0, 0, 0, 0.7)",
    });
    if (loginDataLoginForm.rememberMe) {
      authUtil.setLoginForm(loginDataLoginForm);
    } else {
      authUtil.removeLoginForm();
    }
    // 存储token
    setAccessToken(res.token);

    // 获取用户信息和权限
    const userStore = useUserStoreWithOut();
    const permissionStore = usePermissionStoreWithOut();
    
    try {
      // 获取用户信息
      await userStore.setUserInfoAction();
      // 生成路由
      await permissionStore.generateRoutes();
    
      await push({ path: '/' });
    } catch (error) {
      console.error("获取用户信息或生成路由失败:", error);
      message.error("系统初始化失败，请刷新页面重试");
    }
  } finally {
    loginLoading.value = false;
    loading.value.close();
  }
};

// 社交登录
// const doSocialLogin = async (type: number) => {
//   if (type === 0) {
//     message.error('此方式未配置')
//   } else {
//     loginLoading.value = true
//     if (loginData.tenantEnable === 'true') {
//       // 尝试先通过 tenantName 获取租户
//       await getTenantId()
//       // 如果获取不到，则需要弹出提示，进行处理
//       if (!authUtil.getTenantId()) {
//         try {
//           const data = await message.prompt('请输入租户名称', t('common.reminder'))
//           if (data?.action !== 'confirm') throw 'cancel'
//           const res = await LoginApi.getTenantIdByName(data.value)
//           authUtil.setTenantId(res)
//         } catch (error) {
//           if (error === 'cancel') return
//         } finally {
//           loginLoading.value = false
//         }
//       }
//     }
//     // 计算 redirectUri
//     // tricky: type、redirect需要先encode一次，否则钉钉回调会丢失。
//     // 配合 Login/SocialLogin.vue#getUrlValue() 使用
//     const redirectUri =
//       location.origin +
//       '/social-login?' +
//       encodeURIComponent(`type=${type}&redirect=${redirect.value || '/'}`)

//     // 进行跳转
//     window.location.href = await LoginApi.socialAuthRedirect(type, encodeURIComponent(redirectUri))
//   }
// }
watch(
  () => currentRoute.value,
  (route: RouteLocationNormalizedLoaded) => {
    redirect.value = route?.query?.redirect as string;
  },
  {
    immediate: true,
  }
);
onMounted(() => {
  getLoginFormCache();
  // getTenantByWebsite()
});
</script>

<style lang="scss" scoped>
:deep(.anticon) {
  &:hover {
    color: var(--el-color-primary) !important;
  }
}

.login-code {
  float: right;
  width: 100%;
  height: 38px;

  img {
    width: 100%;
    height: auto;
    max-width: 100px;
    vertical-align: middle;
    cursor: pointer;
  }
}
</style>
