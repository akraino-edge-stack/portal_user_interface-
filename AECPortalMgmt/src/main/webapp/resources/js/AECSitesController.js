/* 
 * Copyright (c) 2018 AT&T Intellectual Property. All rights reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *        http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
angular.module('PortalManagement').controller('AECSitesController', function($scope, $http, $sce, ngDialog, $filter, filterFilter,$rootScope,$controller,hostUrl,$localStorage,camundaUrl) {
    $scope.signOut = "Sign Out"
    $scope.regionHeader = 'Region';
    $scope.SiteHeader = 'Sites';
    $scope.buildHeader = 'Action';
    $scope.buildStatusHeader = 'Build Status';
    $scope.deployHeader = 'Action';
    $scope.deployStatusHeader = 'Deploy Status';
    $scope.sortingOrder = '';
    $scope.reverse = false;
    $scope.filteredItems = [];
    $scope.groupedItems = [];
    $scope.itemsPerPage = 6;
    $scope.pagedItems = [];
    $scope.currentPage = 0;
    $scope.selectionButton = true;
    $scope.size = 10;
    $scope.fileUploadStatus ="";
    $scope.tokenId = localStorage.getItem("tokenId");
    $controller('commonController', { $scope: $scope }); 
    $scope.update = function(hostIndex) {
    	if($scope.itemsPerPage > 6){
    $scope.rowIndex = ($scope.currentPage-1)*$scope.itemsPerPage+hostIndex+1;
        console.log($scope.rowIndex);
        $scope.hostIndex = $scope.rowIndex;
    	}
    	else{
        $scope.hostIndex = hostIndex;
    	}
        $scope.selectionButton = false;
        $scope.sites[$scope.hostIndex].selection = true;
        console.log($scope.sites[$scope.hostIndex].selection);
        
    }
    $scope.callblueprint=function(index){
    	$scope.sites[index].blueprintType = 'Rover';
    	//console.log($scope.sites[index].blueprintType);
    }
    $scope.uploadFile = function(index){
    	ngDialog.open({
            scope: $scope,
            template: 'siteUploadForm',
            closeByDocument: false,
            controller: 'PopUpUploadController',
            appendClassName: 'ngdialog-custom',
            width: '800px'
        });
    	
    }
    $scope.loadSitePopup = function(index) {
        $scope.selectedSites = $scope.sites[index].edgeSiteName;
        $scope.popupregionName = $scope.sites[index].regionName;
        $scope.popupsiteName = $scope.selectedSites;
        $scope.popUpedgeSiteBuildStatus = $scope.sites[index].buildStatus;
        $scope.popUpedgeSiteDeployCreateTarStatus = $scope.sites[index].createTarStatus;
        $scope.popUpedgeSiteDeployGenesisNodeStatus = $scope.sites[index].genesisNodeStatus;
        $scope.popUpedgeSiteDeployToolStatus = $scope.sites[index].deployToolStatus;
        $scope.popUpbuildDate = $scope.sites[index].buildDate;
        $scope.popUpdeployDate = $scope.sites[index].deployDate;
        $scope.popUpVnf = $scope.sites[index].vCDNStatus;
        $http({
            method: 'GET',
            url: 'http://'+hostUrl+'/AECPortalMgmt/files/' + $scope.sites[index].edgeSiteName,
            headers: {
                "Content-Type": "text/plain",
                'tokenId' : $scope.tokenId
            }
        }).then(function(response) {
            $scope.Data = response.data;
        }, function(error) {});
        ngDialog.open({
            scope: $scope,
            template: 'sitetemplateForm',
            closeByDocument: false,
            controller: 'PopUpSiteController',
            appendClassName: 'ngdialog-custom',
            width: '800px'
        });
    }
    var searchMatch = function(haystack, needle) {
        if (!needle) {
            return true;
        }
        return haystack.ignoreCase().toindexOf(needle.ignoreCase()) !== -1;
    }
    $scope.search = function() {
        $scope.filteredItems = $filter('filter')($scope.sites, function(item) {
            for (var attr in item) {
                if (searchMatch(item[attr], $scope.query))
                    return true;
            }
            return false;
        });
        if ($scope.sortingOrder !== '') {
            $scope.filteredItems = $filter('orderBy')($scope.filteredItems, $scope.sortingOrder, $scope.reverse);
        }
        $scope.currentPage = 0;
        $scope.groupToPages();
    }
    $scope.groupToPages = function() {
        $scope.pagedItems = [];
        for (var i = 0; i < $scope.filteredItems.length; i++) {
            if (i % $scope.itemsPerPage === 0) {
                $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)] = [$scope.filteredItems[i]];
            } else {
                $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)].push($scope.filteredItems[i]);
            }
        }
    }
    $scope.range = function(start, end) {
        var ret = [];
        if (!end) {
            end = start;
            start = 0;
        }
        for (var i = start; i < end; i++) {
            ret.push(i);
        }
        return ret;
    }
    $scope.prevPage = function() {
        if ($scope.currentPage > 0) {
            $scope.currentPage--;
        }
    }
    $scope.nextPage = function() {
        if ($scope.currentPage < $scope.pagedItems.length - 1) {
            $scope.currentPage++;
        }
    }
    $scope.setPage = function() {
        $scope.currentPage = this.n;
    }
    allSitesDisplay = function() {
        $http({
            method: 'GET',
            url: 'http://'+hostUrl+'/AECPortalMgmt/edgeSites/0',
            headers: {
                'Content-Type': "application/json",
                'Accept': "application/json",
                'tokenId' : $scope.tokenId
            }
        }).then(function(response) {
            $scope.sites = response.data;
            $scope.search();
            $scope.showSitesTable = true;
        }, function(error) {
        	 $scope.errorHandle(error);
        });
    }
    allSitesDisplay();
    $scope.refreshRegionChange = function() {
        allSitesDisplay();
    }
    $scope.selectedRegionChange = function() {
        if ($scope.selectedRegion == null) {
            allSitesDisplay();
        } else {
            $http({
                method: 'GET',
                url: 'http://'+hostUrl+'/AECPortalMgmt/edgeSites/' + $scope.selectedRegion.regionId,
                headers: {
                    'Content-Type': "application/json",
                    'Accept': "application/json",
                    'tokenId' : $scope.tokenId
                }
            }).then(function(response) {
                $scope.sites = response.data;
                $scope.showSitesTable = true;
                $scope.search();
            }, function(error) {
            	$scope.errorHandle(error);
            });
        }
    }
    $scope.buildEdgeSite = function(index) {
        $scope.sites[index].buildStatus = 'In Progress...';
        $http({
            method: 'POST',
            url: 'http://'+camundaUrl+'/build/',
            data: {
                filepath: '/root/camunda_test.sh',
                targetfolder: '/tmp/yaml_builds',
                fileparams: '/root/yaml_builds'
            },
            headers: {
                'Content-Type': "application/json",
                'Accept': "application/json",
            }
        }).then(function(response) {
            if (response.data.status == '200') {
                $scope.sites[index].buildStatus = 'build complete';
                $scope.sites[index].viewBuildFile = 'view yaml build file...';
                $scope.buildCompleteDate = new Date();
                updateEdgeSiteStatus($scope.sites[index].edgeSiteName, $scope.sites[index].buildStatus,buildCompleteDate);
            } else {
                $scope.sites[index].buildStatus = response.data.message;
                $scope.buildCompleteDate = new Date();
                updateEdgeSiteStatus($scope.sites[index].edgeSiteName, $scope.sites[index].buildStatus,buildCompleteDate);
            }
        }, function(error) {
        	$scope.sites[index].buildStatus = "build error..";
        	
        });
    }
    $scope.airshipDeploy = function(index){
    	$http({
	            method: 'POST',
	            url: 'http://'+camundaUrl+'/airship/',
	            data: {
	            	 "sitename": $scope.sites[index].edgeSiteName,
	            	 "filepath":"/opt/akraino/redfish/install_server_os.sh ", 
	            	 "fileparams": "/opt/akraino/redfish/install_server_os.sh --rc /opt/akraino/server-build/"+ $scope.sites[index].edgeSiteName + " --no-confirm", 
	            	 "winscpdir": "/opt", 
	            	 "winscpfilepath": "nare.sh", 
	            	 "remotserver":$scope.sites[index].edgeSiteIP,
	            	 "port": 22,
	            	 "username": $scope.sites[index].edgeSiteUser,
	            	 "password":$scope.sites[index].edgeSitePwd,
	            	 "destdir":"/opt ",
	            	 "remotefilename": "akraino_airship_deploy.sh"
	            	},
	            headers: {
	                'Content-Type': "application/json",
	                'Accept': "application/json",
	            }
	        }).then(function(response) {
	            if (response.data.status == '200') {
	                $scope.sites[index].deployStatus = 'Completed';
	            } else {
	                $scope.sites[index].deployStatus = response.data.message;
	            }
	        }, function(error) {
	        	$scope.sites[index].deployStatus = 'Deploy error';
	        });
    }
    $scope.deployEdgeSite = function(index) {
    	console.log($scope.sites[index].blueprintType);
    	if($scope.sites[index].blueprintType == 'Rover'){
    		
    		 $scope.sites[index].deployStatus = 'In Progress...';
    		 $scope.airshipDeploy(index);
    		 /*$http({
    	            method: 'POST',
    	            url: 'http://'+hostUrl+'/AECPortalMgmt/copyinput',
    	            data: {
    	                "siteName":$scope.sites[index].edgeSiteName,
    	                "blueprint":$scope.sites[index].blueprint
    	                
    	            },
    	            headers: {
    	                'Content-Type': "application/json",
    	                'Accept': "application/json",
    	                'tokenId' : $scope.tokenId
    	            }
    	        }).then(function(response) {
    	        	if (response.data.status == '200') {
    	        		
    	        		
    	            } 
    	        	else{
    	        		$scope.sites[index].deployStatus = 'Deploy error';	
    	        	}
    	        }, function(error) {
    	        	$scope.errorHandle(error);
    	        });*/
    		 
 	
    	}
    	else{
        $scope.sites[index].deployStatus = 'In Progress...';
        $http({
            method: 'POST',
            url: 'http://'+camundaUrl+'/deploy/',
            data: {
                "filepath1": "/root/camunda_test.sh",
                "filepath2": "/root/camunda_test.sh",
                "deploymentverifier": "/root/shell.sh",
                "noofiterations": 2,
                "waittime": 12
            },
            headers: {
                'Content-Type': "application/json",
                'Accept': "application/json",
            }
        }).then(function(response) {
            if (response.data.status == '200') {
                $scope.sites[index].deployStatus = 'Completed';
            } else {
                $scope.sites[index].deployStatus = response.data.message;
            }
        }, function(error) {
        	$scope.sites[index].deployStatus = 'Deploy error';
        });
    }
    }
    $scope.viewYamlBuildFile = function(index) {
        $http({
            method: 'GET',
            url: 'http://'+hostUrl+'/AECPortalMgmt/files/' + $scope.sites[index].edgeSiteName,
            headers: {
                "Content-Type": "text/plain",
                'tokenId' : $scope.tokenId
            }
        }).then(function(response) {
            $scope.buildyamloutput = response.data;
            loadPopUp();
            /*var file = new Blob([response], {type: 'application/text'});
            var fileURL = URL.createObjectURL(file);
            $scope.content = $sce.trustAsResourceUrl(fileURL);
            $scope.viewBuildFileFlag = true;*/
        }, function(error) {
        	$scope.errorHandle(error);
        });
    }
    loadPopUp = function() {
        ngDialog.open({
            template: 'yamlbuildfile.html',
            className: 'ngdialog-theme-plain',
            scope: $scope,
            appendClassName: 'ngdialog-custom',
            width: '800px',
            data: $scope.buildyamloutput
        });
    }
    $scope.updateEdgeSiteStatus = function(siteName, status ,Date) {
        $scope.siteName = siteName;
        $scope.status = status;
        $scope.Date = Date;
        $http({
            method: 'POST',
            url: 'http://'+hostUrl+'/AECPortalMgmt/edgeSites/status',
            data: {
                "siteName": $scope.siteName,
                "buildStatus": $scope.status,
                "buildDate":$scope.Date
            },
            headers: {
                'Content-Type': "application/json",
                'Accept': "application/json",
                'tokenId' : $scope.tokenId
            }
        }).then(function(response) {
        }, function(error) {
        	$scope.errorHandle(error);
        });
    }
    $scope.vnfOnboard = function(index){  
    	$scope.popupsiteName = $scope.sites[index].edgeSiteName;
        $scope.popupregionName = $scope.sites[index].regionName;
        ngDialog.open({
            scope: $scope,
            template: 'vnftemplateForm',
            closeByDocument: false,
            controller: 'PopUpvnfController',
            appendClassName: 'ngdialog-custom',
            width: '800px'
        });
    }
    $scope.readHeatTemplate = function(vnfName){
    	$scope.vnf = vnfName;
    	//$scope.heattemplateoutput ="hi";
    	 $http({
             method: 'GET',
             url: 'http://'+hostUrl+'/AECPortalMgmt/files/heat/' + $scope.vnf,
             headers: {
                 "Content-Type": "text/plain",
                 'tokenId' : $scope.tokenId
             }
         }).then(function(response) {
             $scope.heattemplateoutput = response.data;
         }, function(error) {
         	$scope.errorHandle(error);
         });
    }
    $http({
        method: 'GET',
        url: 'http://'+hostUrl+'/AECPortalMgmt/regions/',
        headers: {
            'Content-Type': "application/json",
            'Accept': "application/json",
            'tokenId' : $scope.tokenId
        }
    }).then(function(response) {
        $scope.regions = response.data;
    }, function(error) {
    	$scope.errorHandle(error);
    });
});
angular.module('PortalManagement').controller('PopUpSiteController', function($scope,$http, ngDialog) {
	$scope.cancel = function() {
        $scope.closeThisDialog();
    };
});
angular.module('PortalManagement').controller('PopUpvnfController', function($scope,$http, ngDialog,$localStorage,camundaUrl) {
	$scope.callreadVnf = function(){
	$scope.$parent.readHeatTemplate($scope.vnfType);
	}
	$scope.onBoard = function(index){
        $http({
     method: 'POST',
     url: 'http://'+camundaUrl+'/apache/',
     data: {
    	 "sitename": $scope.sites[index].edgeSiteName,
         "remoteserver": $scope.sites[index].edgeSiteIP,
         "username": $scope.sites[index].edgeSiteUser,
         "password": $scope.sites[index].edgeSitePwd,
         "portnumber": 22,
         "srcdir": "/tmp/tempest",
         "destdir": "/tmp/ats-demo-back",
         "filename": "run_ats-demo.sh",
         "fileparams": "OS_USER_DOMAIN_NAME=Default OS_PROJECT_DOMAIN_NAME=Default OS_USERNAME=admin OS_PASSWORD=password OS_REGION_NAME=RegionOne NETWORK_NAME=public-47",
         "noofiterations": 0,
         "waittime": 15,
         "filetrasferscript": "/tmp/tempest/mv.sh"
     },
     headers: {
         'Content-Type': "application/json",
         'Accept': "application/json",
     }
	        }).then(function(response) {
	        	if (response.data.status == '200') {
	        		$scope.$parent.sites[index].vCDNStatus = 'Completed';
	            } 
	        }, function(error) { 
	        });
        $scope.closeThisDialog('cancel');
	}
	$scope.cancel = function() {
        $scope.closeThisDialog();
    };
});
angular.module('PortalManagement').controller('PopUpUploadController', function($scope,$http, ngDialog,$localStorage,hostUrl,Upload) {
	$scope.upload = function(index,file){
				
		file.upload = Upload.upload({
			url:'http://'+hostUrl+'/AECPortalMgmt/edgeSites/upload',
			method:'POST',
			file:file,
			data:{
				"siteName" :$scope.sites[index].edgeSiteName,
                "blueprint":$scope.sites[index].blueprintType,
                "edgeSiteIP": $scope.siteIPaddress,
               
                "edgeSiteUser":$scope.siteUsername,
                "edgeSitePwd":$scope.sitePassword
            	
            },
            headers: {'Content-Type': undefined}
		}).then(function(response){
			if(response.data.statusCode == '200'){
			$scope.sites[index].fileUploadMessage = "File uploaded,successfully.";
			$scope.sites[index].fileUploadStatus = "Completed";
			console.log(response.statusCode);
			}
		},function(response){
			console.log(response);
		});
		 $scope.closeThisDialog('cancel');
		 
	}
	$scope.cancel = function() {
        $scope.closeThisDialog();
    };

});
