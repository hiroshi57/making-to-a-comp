"""
TimesFM Forecasting Wrapper — making-to-a-comp
売上・コスト・受注数の時系列予測

Usage:
    from forecasting.forecast import Forecaster
    fc = Forecaster()
    result = fc.predict(history=[620, 780, 850, 1020, 940, 1180], horizon=6)
"""

from __future__ import annotations
import sys
import os
import json
from dataclasses import dataclass, field
from typing import Optional

# TimesFM はサブモジュールの venv に入っているため path を追加
_TIMESFM_VENV = os.path.join(os.path.dirname(__file__), "..", "timesfm")
if _TIMESFM_VENV not in sys.path:
    sys.path.insert(0, _TIMESFM_VENV)


@dataclass
class ForecastResult:
    horizon: int
    point:   list[float]       # 予測値
    lower:   list[float]       # 10th percentile
    upper:   list[float]       # 90th percentile
    labels:  list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "horizon": self.horizon,
            "point":   [round(v, 2) for v in self.point],
            "lower":   [round(v, 2) for v in self.lower],
            "upper":   [round(v, 2) for v in self.upper],
            "labels":  self.labels,
        }

    def to_dashboard_js(self) -> str:
        """dashboard/data.js の FORECAST ブロックに貼り付けられる形式で返す"""
        d = self.to_dict()
        return (
            f"const FORECAST = {{\n"
            f"  labels:  {json.dumps(d['labels'], ensure_ascii=False)},\n"
            f"  revenue: {d['point']},\n"
            f"  lower:   {d['lower']},\n"
            f"  upper:   {d['upper']},\n"
            f"}};"
        )


class Forecaster:
    """
    TimesFM 2.5 を使った時系列予測クラス。
    モデルのロードに失敗した場合は線形外挿フォールバックを使用する。
    """

    def __init__(self, use_quantile: bool = True):
        self.use_quantile = use_quantile
        self._model = None
        self._config = None
        self._available = self._try_load()

    def _try_load(self) -> bool:
        try:
            import torch
            import timesfm
            from dotenv import load_dotenv
            load_dotenv()

            # HuggingFace トークン（モデルダウンロードに必要な場合）
            hf_token = os.environ.get("HF_TOKEN")
            if hf_token:
                try:
                    from huggingface_hub import login
                    login(token=hf_token, add_to_git_credential=False)
                except Exception:
                    pass

            torch.set_float32_matmul_precision("high")
            self._model = timesfm.TimesFM_2p5_200M_torch.from_pretrained(
                "google/timesfm-2.5-200m-pytorch",
                **({"token": hf_token} if hf_token else {}),
            )
            self._config = timesfm.ForecastConfig(
                max_context=1024,
                max_horizon=256,
                normalize_inputs=True,
                use_continuous_quantile_head=self.use_quantile,
                force_flip_invariance=True,
                infer_is_positive=True,
                fix_quantile_crossing=True,
            )
            self._model.compile(self._config)
            return True
        except Exception as e:
            print(f"[Forecaster] TimesFM unavailable ({e}), using linear fallback.")
            return False

    def predict(
        self,
        history: list[float],
        horizon: int = 6,
        month_labels: Optional[list[str]] = None,
    ) -> ForecastResult:
        """
        history: 過去の時系列データ（例: 月次売上リスト）
        horizon: 予測ステップ数
        """
        if self._available:
            return self._predict_timesfm(history, horizon, month_labels)
        return self._predict_linear(history, horizon, month_labels)

    def _predict_timesfm(
        self,
        history: list[float],
        horizon: int,
        labels: Optional[list[str]],
    ) -> ForecastResult:
        import numpy as np

        point_fc, quantile_fc = self._model.forecast(
            horizon=horizon,
            inputs=[np.array(history, dtype=float)],
        )
        point = point_fc[0].tolist()
        lower = quantile_fc[0, :, 1].tolist()   # 10th percentile
        upper = quantile_fc[0, :, -1].tolist()  # 90th percentile
        return ForecastResult(
            horizon=horizon,
            point=point[:horizon],
            lower=lower[:horizon],
            upper=upper[:horizon],
            labels=labels or _month_labels(horizon),
        )

    def _predict_linear(
        self,
        history: list[float],
        horizon: int,
        labels: Optional[list[str]],
    ) -> ForecastResult:
        """TimesFM が使えない場合の線形外挿フォールバック"""
        import numpy as np

        n = len(history)
        x = np.arange(n)
        slope, intercept = np.polyfit(x, history, 1)
        future_x = np.arange(n, n + horizon)
        point = (slope * future_x + intercept).tolist()
        std = float(np.std(history)) * 0.8
        lower = [max(0, v - 1.28 * std) for v in point]
        upper = [v + 1.28 * std for v in point]
        return ForecastResult(
            horizon=horizon,
            point=point,
            lower=lower,
            upper=upper,
            labels=labels or _month_labels(horizon),
        )


def _month_labels(n: int) -> list[str]:
    """直近 n ヶ月のラベルを生成"""
    from datetime import date
    from dateutil.relativedelta import relativedelta
    months = []
    base = date.today().replace(day=1)
    for i in range(1, n + 1):
        d = base + relativedelta(months=i)
        months.append(f"{d.month}月")
    return months


if __name__ == "__main__":
    # 動作確認
    history = [620, 780, 850, 1020, 940, 1180, 1050, 1240, 1380, 1520, 1640, 1870]
    fc = Forecaster()
    result = fc.predict(history, horizon=6)
    print(result.to_dashboard_js())
