{{- define "larpit.labels" -}}
stack: larpit
{{- end -}}

{{- define "larpit.secretName" -}}
{{ .Values.existingSecretName | default "larpit" }}
{{- end -}}

{{- define "larpit.tlsSecretName" -}}
tls-larpit
{{- end -}}

{{- define "larpit.podSecurityContext" -}}
runAsUser: 1000
runAsGroup: 1000
fsGroup: 1000
runAsNonRoot: true
seccompProfile:
  type: RuntimeDefault
{{- end -}}

{{- define "larpit.containerSecurityContext" -}}
allowPrivilegeEscalation: false
capabilities:
  drop: [ALL]
{{- end -}}

{{- define "larpit.envFrom" -}}
- configMapRef:
    name: larpit
- secretRef:
    name: {{ include "larpit.secretName" . }}
{{- end -}}
