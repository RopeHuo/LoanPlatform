#coding:utf-8
import os,time
base_path = '~/workspace/'
ssh_config = [['s2.unionpaybank.com','/data/card/app']]

file_list = []
    
def getFile(dir_path=''):
    if dir_path=='':
        dir_path = base_path
    # for a in range(1):
    now_time = int(time.time())
    
    for i in os.listdir(dir_path):
        the_path = '%s/%s' % (dir_path ,i)
        if the_path.find('.pyc')!=-1:
            continue
        if the_path.find('.DS_Store') != -1:
            continue
        # if the_path.find('models/base.py') != -1:
        #     continue
        # if the_path.find('templates/mobile/bang/') !=-1 and the_path.find('templates/mobile/bang/admin')==-1:
        #     # print(the_path)
        #     continue
        # if the_path.find('templates/mobile/home/') !=-1:
        #     continue
        if os.path.isdir(the_path):
            getFile(the_path)
        else:
            modify_time = int(os.path.getmtime(the_path))
            if (now_time - modify_time) < 3600 * 4:
                file_list.append(the_path)

def clearStatic():
    for server,path in ssh_config:
        cmd_reboot = "ssh root@%s 'cd %s/static/js/ && rm *.js -rf'" % (server,path)
        print(cmd_reboot)
        os.system(cmd_reboot)

def upload():
    for server,path in ssh_config:
        for item in file_list:
            target_item = item.split('/dist')[1]
            target_item = target_item.replace(target_item.split('/')[-1],'')
            cmd_ssh = 'scp %s root@%s:%s%s' % (item,server,path,target_item)
            print(cmd_ssh) 
            if target_item.find('index.html')==-1: 
                os.system(cmd_ssh)
        cmd_ssh = 'scp ../card_app/dist/index.html root@%s:%s/' % (server,path)
        os.system(cmd_ssh)
if __name__ == '__main__':
    # clearStatic()
    getFile('../card_app/dist')
    print('\n'.join(file_list))
    print(file_list.__len__())
    upload()