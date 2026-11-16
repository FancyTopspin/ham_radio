from allauth.account.adapter import DefaultAccountAdapter
from allauth.account import app_settings

class CustomAccountAdapter(DefaultAccountAdapter):
    def is_login_by_code_required(self, login) -> bool:
        """
        Fix for upstream django-allauth 65.x bug where LoginByCodeStage.handle()
        calls get_adapter().is_login_by_code_required(self.login) without passing self.request,
        causing AttributeError: 'NoneType' object has no attribute 'session'.
        """
        if not app_settings.LOGIN_BY_CODE_REQUIRED:
            return False
        if not getattr(self, 'request', None):
            return False
        return super().is_login_by_code_required(login)
