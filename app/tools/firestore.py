from typing import Dict

MOCK_USER_LEVELS = {
    "default": {
        "name": "ゲスト",
        "current_level": 100,
    }
}


def get_user_level(user_id: str) -> Dict[str, any]:
    """
    ユーザーの現在の学習レベルと進捗状況を取得します。

    Args:
        user_id: ユーザーの識別子

    Returns:
        Dict with user's current level information
    """
    # 実際のデータベースの代わりにモックデータを返す
    user_data = MOCK_USER_LEVELS.get(user_id, MOCK_USER_LEVELS["default"])
    return {
        "name": user_data["name"],
        "current_level": user_data["current_level"],
    }


def set_user_name(user_id: str, name: str) -> Dict[str, str]:
    """
    ユーザーの名前と敬称を設定します。

    Args:
        user_id: ユーザーの識別子
        name: ユーザーの名前
        name_suffix: 敬称（ちゃん/くん/さん）

    Returns:
        Dict with user name information
    """
    if user_id not in MOCK_USER_LEVELS:
        MOCK_USER_LEVELS[user_id] = dict(MOCK_USER_LEVELS["default"])

    user_data = MOCK_USER_LEVELS[user_id]
    user_data["name"] = name

    return {
        "name": name,
        "current_level": 1,
    }
