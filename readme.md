# Backup automático dos Volumes EC2 usando Lambda

 ## Lambda - Crie uma nova função
  * Runtime: NodeJS 4 ou 6
  * Role: Crie uma nova
  * Clique em `View Policy Document` -> `Edit` para editar o Json e deixe conforme abaixo, isso dará as permissões necessárias para a função
 ```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "ec2:DeleteSnapshot",
                "ec2:DescribeVolumes",
                "ec2:CreateSnapshot",
                "ec2:DescribeSnapshots",
                "ec2:CreateTags"
            ],
            "Resource": "*"
        }
    ]
}
 ```
 
 ## Usaremos o `CloudWatch Events` para disparar a função lambda 1 vez por dia
  * Adicione a trigger `CloudWatch Events`
  * Configure como tipo `Schedule expression`
  * Use a expressão `rate(1 day)`

 ## Função
Você pode usar o próprio editor online e colar o conteúdo do arquivo index.js para enviar o código-fonte.

 ## Configurando o período de retenção
Crie uma variável de ambiente com a `key = RETENCAO_DIAS` e o valor igual ao número de dias que voce deseja reter o backup


 ## Timeout
Em `Basic settings` configure o tempo de execução para 1 minuto pelo menos, se voce tiver muitos volumes a função pode demorar um pouco mais, ajute conforme sua necessidade.

O Script está configurado e pronto para rodar.
 
> Para ver uma implementação em PHP para usar no Linux com Cron [veja esse gist](https://gist.github.com/azizvc/66875896be7c11f789561f8bb03c34ef). 

