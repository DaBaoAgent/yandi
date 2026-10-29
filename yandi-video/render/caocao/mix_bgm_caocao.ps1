# 曹操 BGM 混音（七步法）：配音+音效 full_mix_caocao.wav + 历史史诗 BGM
$ErrorActionPreference = 'Stop'
$ff = "D:\@kaifa\yandi\vendor\gpt-sovits\runtime\ffmpeg.exe"
Set-Location -LiteralPath "D:\@kaifa\yandi\yandi-video\render\caocao"
$bgm = "D:\@kaifa\@\BGM\历史\历史-史诗 Epic Music [Historical Documentary Background Music for Videos, Royalty Free Historical Music].mp3"
$vol = 0.074
$dur = 187.1
# 1) 第一遍：测 loudnorm 参数
& $ff -y -i "full_mix_caocao.wav" -stream_loop -1 -i $bgm -filter_complex `
  "[0:a]aformat=channel_layouts=stereo[v];[1:a]highpass=f=38,volume=$vol,afade=t=in:st=0:d=3,afade=t=out:st=180:d=7[b];[v][b]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:print_format=json[out]" `
  -map "[out]" -t $dur -c:a pcm_s16le "_pass1_caocao.wav" 2> "_loudnorm1.txt"
$json = Get-Content -LiteralPath "_loudnorm1.txt" -Raw | Select-String -Pattern '\{[\s\S]*\}' -AllMatches
$m = $json.Matches[0].Value | ConvertFrom-Json
Write-Output ("measured I={0} TP={1} LRA={2} thresh={3}" -f $m.input_i, $m.input_tp, $m.input_lra, $m.input_thresh)
# 2) 第二遍：线性应用
& $ff -y -i "full_mix_caocao.wav" -stream_loop -1 -i $bgm -filter_complex `
  "[0:a]aformat=channel_layouts=stereo[v];[1:a]highpass=f=38,volume=$vol,afade=t=in:st=0:d=3,afade=t=out:st=180:d=7[b];[v][b]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:measured_I=$($m.input_i):measured_TP=$($m.input_tp):measured_LRA=$($m.input_lra):measured_thresh=$($m.input_thresh):linear=true[out]" `
  -map "[out]" -t $dur -c:a pcm_s16le "final_mix_caocao.wav"
Write-Output "final mix written"
# 3) 复测
& $ff -i "final_mix_caocao.wav" -af ebur128=peak=true -f null - 2>&1 | Select-String "I:" | Select-Object -Last 1
